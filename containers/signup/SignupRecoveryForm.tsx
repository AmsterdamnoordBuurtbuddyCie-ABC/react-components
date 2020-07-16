import React, { useRef, useState, ChangeEvent, FormEvent } from 'react';
import { c } from 'ttag';
import {
    Alert,
    EmailInput,
    LinkButton,
    PrimaryButton,
    IntlTelInput,
    useModals,
    ConfirmModal,
    Challenge,
    Label,
    useLoading,
    FullLoader
} from '../../index';

import { SignupModel, SignupErrors } from './interfaces';
import { SIGNUP_STEPS } from './constants';
import InlineLinkButton from '../../components/button/InlineLinkButton';
import { ChallengeRef, ChallengeResult } from '../../components/challenge/ChallengeFrame';

interface Props {
    model: SignupModel;
    onChange: (model: SignupModel) => void;
    onSubmit: (payload: ChallengeResult) => void;
    onSkip: (payload: ChallengeResult) => void;
    errors: SignupErrors;
    loading: boolean;
}

const { RECOVERY_EMAIL, RECOVERY_PHONE } = SIGNUP_STEPS;

const SignupRecoveryForm = ({ model, onChange, onSubmit, onSkip, errors, loading }: Props) => {
    const formRef = useRef<HTMLFormElement>(null);
    const [challengeLoading, setChallengeLoading] = useState(true);
    const { createModal } = useModals();
    const challengeRefRecovery = useRef<ChallengeRef>();
    const [loadingChallenge, withLoadingChallenge] = useLoading();
    const disableSubmit = model.step === RECOVERY_EMAIL ? !!errors.recoveryEmail : !!errors.recoveryPhone;

    const handleChangePhone = (status: any, value: any, countryData: any, number: string) => {
        onChange({ ...model, recoveryPhone: number });
    };

    const handleSkip = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Warning`} onConfirm={resolve} onClose={reject}>
                    <Alert type="warning">{c('Info')
                        .t`You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?`}</Alert>
                </ConfirmModal>
            );
        });
        const payload = await challengeRefRecovery.current?.getChallenge();
        onSkip(payload);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const payload = await challengeRefRecovery.current?.getChallenge();
        onSubmit(payload);
    };

    const handleChallengeLoaded = () => setChallengeLoading(false);

    const inner = (() => {
        if (model.step === RECOVERY_EMAIL) {
            return (
                <>
                    <p>{c('Info')
                        .t`We will send you a recovery link to this email address if you forget your password or get locked out of your account.`}</p>
                    <div className="flex onmobile-flex-column signup-label-field-container mb1">
                        <Label htmlFor="recovery-email">{c('Label').t`Recovery email`}</Label>
                        <div className="flex-item-fluid">
                            <Challenge
                                bodyClassName="signLayout-container"
                                challengeRef={challengeRefRecovery}
                                type={1}
                                onLoaded={handleChallengeLoaded}
                            >
                                <div className="mb0-5">
                                    <EmailInput
                                        id="recovery-email"
                                        name="recovery-email"
                                        autoFocus
                                        autoComplete="on"
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                        value={model.recoveryEmail}
                                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                            onChange({ ...model, recoveryEmail: target.value })
                                        }
                                        onKeyDown={({ keyCode }: React.KeyboardEvent<HTMLInputElement>) =>
                                            keyCode === 13 && formRef.current?.submit()
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <InlineLinkButton
                                        id="recovery-phone-button"
                                        onClick={() => onChange({ ...model, recoveryEmail: '', step: RECOVERY_PHONE })}
                                    >{c('Action').t`Add a recovery phone number instead`}</InlineLinkButton>
                                </div>
                            </Challenge>
                        </div>
                    </div>
                </>
            );
        }

        if (model.step === RECOVERY_PHONE) {
            return (
                <>
                    <p>{c('Info')
                        .t`We will send a code to this phone number if you forget your password or get locked out of your account.`}</p>
                    <div className="flex onmobile-flex-column signup-label-field-container mb1">
                        <Label htmlFor="recovery-phone">{c('Label').t`Recovery phone`}</Label>
                        <div className="flex-item-fluid">
                            <div className="mb0-5">
                                <IntlTelInput
                                    id="recovery-phone"
                                    name="recovery-phone"
                                    containerClassName="w100"
                                    inputClassName="w100"
                                    autoFocus
                                    onPhoneNumberChange={handleChangePhone}
                                    required
                                />
                            </div>
                            <div>
                                <InlineLinkButton
                                    onClick={() => onChange({ ...model, recoveryPhone: '', step: RECOVERY_EMAIL })}
                                >{c('Action').t`Add an email address instead`}</InlineLinkButton>
                            </div>
                        </div>
                    </div>
                </>
            );
        }
    })();

    return (
        <>
            {model.step === RECOVERY_EMAIL && challengeLoading ? (
                <div className="aligncenter">
                    <FullLoader className="color-primary" size={200} />
                </div>
            ) : null}
            <form
                name="recoveryForm"
                className="signup-form"
                onSubmit={(e) => withLoadingChallenge(handleSubmit(e))}
                hidden={model.step === RECOVERY_EMAIL && challengeLoading}
                ref={formRef}
            >
                {inner}
                <div className="alignright mb1">
                    <LinkButton
                        className="mr2 pm-button--large nodecoration"
                        disabled={loading || loadingChallenge}
                        onClick={handleSkip}
                    >{c('Action').t`Skip`}</LinkButton>
                    <PrimaryButton
                        className="pm-button--large"
                        loading={loading || loadingChallenge}
                        disabled={disableSubmit}
                        type="submit"
                    >{c('Action').t`Next`}</PrimaryButton>
                </div>
            </form>
        </>
    );
};

export default SignupRecoveryForm;
