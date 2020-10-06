import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { c } from 'ttag';

import {
    getAuthenticationMethod,
    createMailImport,
    createJobImport,
    getMailImportFolders,
    getMailImport,
    updateMailImport,
    resumeMailImport,
} from 'proton-shared/lib/api/mailImport';
import { noop } from 'proton-shared/lib/helpers/function';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';

import { useLoading, useAddresses, useModals, useApi, useEventManager } from '../../../hooks';
import {
    ConfirmModal,
    FormModal,
    Button,
    PrimaryButton,
    Alert,
    ErrorButton,
    useDebounceInput,
} from '../../../components';
import ImportMailWizard from '../../../components/import/ImportMailWizard';

import { TIME_UNIT, IMAP_CONNECTION_ERROR_LABEL } from '../constants';

import {
    Step,
    ImportModalModel,
    IMPORT_ERROR,
    MailImportFolder,
    FolderMapping,
    Importer,
    PROVIDER_INSTRUCTIONS,
} from '../interfaces';

import ImportInstructionsStep from './steps/ImportInstructionsStep';
import ImportStartStep from './steps/ImportStartStep';
import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from './steps/ImportStartedStep';

const DEFAULT_MODAL_MODEL: ImportModalModel = {
    step: Step.INSTRUCTIONS,
    needIMAPDetails: false,
    importID: '',
    email: '',
    password: '',
    port: '',
    imap: '',
    errorCode: 0,
    errorLabel: '',
    providerFolders: [],
    selectedPeriod: TIME_UNIT.BIG_BANG,
    payload: {
        Mapping: [],
    },
    isPayloadValid: false,
};

const GMAIL_INSTRUCTION_STEPS_COUNT = 3;

interface Props {
    currentImport?: Importer;
    onClose?: () => void;
}

const dateToTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

const destinationFoldersFirst = (a: MailImportFolder, b: MailImportFolder) => {
    if (a.DestinationFolder && b.DestinationFolder) {
        return 0;
    }
    if (a.DestinationFolder && !b.DestinationFolder) {
        return -1;
    }
    if (!a.DestinationFolder && b.DestinationFolder) {
        return 1;
    }
    if (a.Source < b.Source) {
        return -1;
    }
    if (a.Source > b.Source) {
        return 1;
    }
    return 0;
};

const ImportMailModal = ({ onClose = noop, currentImport, ...rest }: Props) => {
    const isReconnectMode = !!currentImport;
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();
    const [address] = addresses || [];

    const [providerInstructions, setProviderInstructions] = useState<PROVIDER_INSTRUCTIONS>();
    const [instructionsCurrentStep, setInstructionsCurrentStep] = useState(0);

    const [showPassword, setShowPassword] = useState(false);
    const [modalModel, setModalModel] = useState<ImportModalModel>({
        ...DEFAULT_MODAL_MODEL,
        importID: currentImport?.ID || '',
        email: currentImport?.Email || '',
        imap: currentImport?.ImapHost || '',
        port: currentImport?.ImapPort || '',
    });
    const api = useApi();
    const { call } = useEventManager();

    const changeProvider = (provider: PROVIDER_INSTRUCTIONS) => setProviderInstructions(provider);

    const needAppPassword = useMemo(() => {
        const IMAPsWithAppPasswords = ['imap.mail.yahoo.com'];

        return IMAPsWithAppPasswords.includes(modalModel.imap);
    }, [modalModel.imap]);

    const title = useMemo(() => {
        switch (modalModel.step) {
            case Step.INSTRUCTIONS:
                if (!providerInstructions) {
                    return c('Title').t`Prepare for import`;
                }

                if (providerInstructions === PROVIDER_INSTRUCTIONS.YAHOO) {
                    return c('Title').t`Prepare Yahoo Mail for import`;
                }

                return c('Title').t`Prepare Gmail for import ${
                    instructionsCurrentStep + 1
                }/${GMAIL_INSTRUCTION_STEPS_COUNT}`;
            case Step.START:
                return isReconnectMode ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`;
            case Step.PREPARE:
                return c('Title').t`Start import process`;
            case Step.STARTED:
                return c('Title').t`Import in progress`;
            default:
                return '';
        }
    }, [modalModel.step, providerInstructions, instructionsCurrentStep]);

    const wizardSteps = [c('Wizard step').t`Authenticate`, c('Wizard step').t`Plan import`, c('Wizard step').t`Import`];

    const handleCancel = () => {
        if (!modalModel.email || modalModel.step === Step.STARTED) {
            onClose();
            return;
        }

        createModal(
            <ConfirmModal
                onConfirm={onClose}
                title={c('Confirm modal title').t`Quit import?`}
                cancel={c('Action').t`Continue import`}
                confirm={<ErrorButton type="submit">{c('Action').t`Quit`}</ErrorButton>}
            >
                <Alert type="error">{c('Warning').t`You will lose all progress if you quit.`}</Alert>
            </ConfirmModal>
        );
    };

    const checkAuth = async () => {
        const { Authentication } = await api(getAuthenticationMethod({ Email: modalModel.email }));
        const { ImapHost, ImapPort, ImporterID } = Authentication;

        setModalModel({
            ...modalModel,
            importID: ImporterID,
            imap: ImapHost,
            port: ImapPort,
        });

        setShowPassword(true);
    };

    const debouncedEmail = useDebounceInput(modalModel.email);

    useEffect(() => {
        if (debouncedEmail && validateEmailAddress(debouncedEmail)) {
            withLoading(checkAuth());
        } else {
            setShowPassword(false);
        }
    }, [debouncedEmail]);

    // this one is to avoid a UI glitch when removing the email
    useEffect(() => {
        if (!modalModel.email) {
            setShowPassword(false);
        }
    }, [modalModel.email]);

    const moveToPrepareStep = (importID: string, providerFolders: MailImportFolder[]) => {
        setModalModel({
            ...modalModel,
            providerFolders: providerFolders.sort(destinationFoldersFirst),
            importID,
            step: Step.PREPARE,
        });
    };

    const handleSubmitStartError = (error: Error & { data: { Code: number; Error: string } }) => {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;

        if ([IMPORT_ERROR.AUTH_CREDENTIALS, IMPORT_ERROR.AUTH_IMAP].includes(Code)) {
            setModalModel({
                ...modalModel,
                errorCode: Code,
                errorLabel: Error,
                needIMAPDetails: modalModel.needIMAPDetails || Error === IMAP_CONNECTION_ERROR_LABEL,
            });
        }
    };

    const submitAuthentication = async (needIMAPDetails = false) => {
        /* If we already have an importID we can just fetch the folders and move on */
        if (modalModel.importID) {
            try {
                const { Importer } = await api(getMailImport(modalModel.importID));
                const { Folders = [] } = await api(getMailImportFolders(Importer.ID, { Code: modalModel.password }));
                moveToPrepareStep(Importer.ID, Folders);
            } catch (error) {
                handleSubmitStartError(error);
            }
            return;
        }

        if ((modalModel.imap && modalModel.port) || needIMAPDetails) {
            try {
                const { Importer } = await api(
                    createMailImport({
                        Email: modalModel.email,
                        ImapHost: modalModel.imap,
                        ImapPort: parseInt(modalModel.port, 10),
                        Sasl: 'PLAIN',
                        Code: modalModel.password,
                    })
                );
                await call();

                const { Folders = [] } = await api(getMailImportFolders(Importer.ID, { Code: modalModel.password }));
                moveToPrepareStep(Importer.ID, Folders);
            } catch (error) {
                handleSubmitStartError(error);
            }
            return;
        }

        setModalModel({
            ...modalModel,
            imap: '',
            needIMAPDetails: true,
        });
    };

    const launchImport = async () => {
        const { importID, payload } = modalModel;

        await api(
            createJobImport(importID, {
                ...payload,
                StartTime: payload.StartTime ? dateToTimestamp(payload.StartTime) : undefined,
                EndTime: payload.EndTime ? dateToTimestamp(payload.EndTime) : undefined,
                Mapping: modalModel.payload.Mapping.filter((m: FolderMapping) => m.checked),
            })
        );
        await call();

        setModalModel({
            ...modalModel,
            step: Step.STARTED,
        });
    };

    const resumeImport = async () => {
        await api(
            updateMailImport(modalModel.importID, {
                Email: modalModel.email,
                Code: modalModel.password,
                ImapHost: modalModel.imap,
                ImapPort: parseInt(modalModel.port, 10),
                Sasl: 'PLAIN',
            })
        );
        await api(resumeMailImport(modalModel.importID));
        await call();
        onClose();
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        switch (modalModel.step) {
            case Step.START:
                if (isReconnectMode) {
                    withLoading(resumeImport());
                    return;
                }
                withLoading(submitAuthentication(modalModel.needIMAPDetails));
                break;
            case Step.INSTRUCTIONS:
                if (
                    providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
                    instructionsCurrentStep < GMAIL_INSTRUCTION_STEPS_COUNT - 1
                ) {
                    setInstructionsCurrentStep(instructionsCurrentStep + 1);
                    return;
                }

                setModalModel({
                    ...modalModel,
                    step: Step.START,
                });
                break;
            case Step.PREPARE:
                withLoading(launchImport());
                break;
            case Step.STARTED:
                onClose();
                break;
            default:
                break;
        }
    };

    const cancel = useMemo(() => {
        if (modalModel.step === Step.STARTED) {
            return null;
        }

        if (modalModel.step === Step.INSTRUCTIONS && !providerInstructions) {
            return (
                <Button
                    type="submit"
                    onClick={() => {
                        setModalModel({
                            ...modalModel,
                            step: Step.START,
                        });
                    }}
                >
                    {c('Action').t`Skip to import`}
                </Button>
            );
        }

        return <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>;
    }, [modalModel.step, providerInstructions, loading]);

    const submit = useMemo(() => {
        const { email, password, needIMAPDetails, imap, port, isPayloadValid, step } = modalModel;

        const disabledStartStep = needIMAPDetails ? !email || !password || !imap || !port : !email || !password;

        switch (step) {
            case Step.INSTRUCTIONS:
                return providerInstructions ? (
                    <div>
                        {providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
                            instructionsCurrentStep > 0 &&
                            instructionsCurrentStep < GMAIL_INSTRUCTION_STEPS_COUNT && (
                                <Button
                                    onClick={() => {
                                        setInstructionsCurrentStep(instructionsCurrentStep - 1);
                                    }}
                                    className="mr1"
                                >
                                    {c('Action').t`Back`}
                                </Button>
                            )}
                        <PrimaryButton type="submit">
                            {providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
                            instructionsCurrentStep < GMAIL_INSTRUCTION_STEPS_COUNT - 1
                                ? c('Action').t`Next`
                                : c('Action').t`Start import assistant`}
                        </PrimaryButton>
                    </div>
                ) : null;
            case Step.START:
                return (
                    <PrimaryButton type="submit" disabled={disabledStartStep} loading={loading}>
                        {isReconnectMode ? c('Action').t`Reconnect` : c('Action').t`Next`}
                    </PrimaryButton>
                );
            case Step.PREPARE:
                return (
                    <PrimaryButton loading={loading} disabled={isPayloadValid} type="submit">
                        {c('Action').t`Start import`}
                    </PrimaryButton>
                );
            case Step.STARTED:
                return <PrimaryButton loading={loading} type="submit">{c('Action').t`Close`}</PrimaryButton>;
            default:
                return null;
        }
    }, [
        providerInstructions,
        instructionsCurrentStep,
        modalModel.step,
        modalModel.email,
        modalModel.password,
        modalModel.needIMAPDetails,
        modalModel.imap,
        modalModel.port,
        modalModel.isPayloadValid,
        loading,
    ]);

    return (
        <FormModal
            title={title}
            loading={loading}
            submit={submit}
            close={cancel}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            {...rest}
        >
            {!isReconnectMode && modalModel.step !== Step.INSTRUCTIONS && (
                <ImportMailWizard step={modalModel.step} steps={wizardSteps} />
            )}
            {modalModel.step === Step.INSTRUCTIONS && (
                <ImportInstructionsStep
                    provider={providerInstructions}
                    changeProvider={changeProvider}
                    instructionsCurrentStep={instructionsCurrentStep}
                />
            )}
            {modalModel.step === Step.START && (
                <ImportStartStep
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportModalModel) => setModalModel(newModel)}
                    needAppPassword={needAppPassword}
                    showPassword={showPassword}
                    reconnectMode={isReconnectMode}
                />
            )}
            {modalModel.step === Step.PREPARE && (
                <ImportPrepareStep
                    address={address}
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportModalModel) => setModalModel(newModel)}
                />
            )}
            {modalModel.step === Step.STARTED && !loadingAddresses && address && (
                <ImportStartedStep address={address} modalModel={modalModel} />
            )}
        </FormModal>
    );
};

export default ImportMailModal;
