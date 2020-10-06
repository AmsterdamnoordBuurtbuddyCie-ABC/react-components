import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { resumeMailImport, cancelMailImport } from 'proton-shared/lib/api/mailImport';

import { useApi, useLoading, useNotifications, useEventManager, useModals, useImporters } from '../../hooks';
import {
    Loader,
    Alert,
    Table,
    TableBody,
    TableRow,
    TableCell,
    DropdownActions,
    Badge,
    ConfirmModal,
    Tooltip,
    Icon,
    ErrorButton,
} from '../../components';

import { Importer, ImportMailStatus, ImportMailError } from './interfaces';
import ImportMailModal from './modals/ImportMailModal';

interface RowActionsProps {
    currentImport: Importer;
}

const RowActions = ({ currentImport }: RowActionsProps) => {
    const { ID, Active } = currentImport;
    const { State, ErrorCode } = Active || {};
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const handleResume = async (importID: string) => {
        await api(resumeMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import resumed` });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal currentImport={currentImport} />);
    };

    const handleCancel = async (importID: string) => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={
                        ErrorCode
                            ? c('Confirm modal title').t`Import is incomplete!`
                            : c('Confirm modal title').t`Import is not finished. Cancel anyway?`
                    }
                    cancel={ErrorCode ? c('Action').t`Continue import` : c('Action').t`Back to import`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Cancel import`}</ErrorButton>}
                >
                    <Alert type="error">
                        {ErrorCode
                            ? c('Warning')
                                  .t`If you quit, you will not be able to resume this import. All progress has been saved in your Proton account. Quit anyway?`
                            : c('Warning')
                                  .t`To finish importing, you will have to start over. All progress so far was saved in your Proton account.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(cancelMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import canceled` });
    };

    const list = [];

    if (State === ImportMailStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    withLoadingSecondaryAction(handleReconnect());
                } else {
                    withLoadingSecondaryAction(handleResume(ID));
                }
            },
            loading: loadingSecondaryAction,
        });
    }

    if (State !== ImportMailStatus.CANCELED) {
        list.push({
            text: c('Action').t`Cancel`,
            onClick: () => {
                withLoadingPrimaryAction(handleCancel(ID));
            },
            loading: loadingPrimaryAction,
        });
    }

    return <DropdownActions key="actions" className="pm-button--small" list={list} />;
};

const CurrentImportsSection = () => {
    const [imports = [], importsLoading] = useImporters();

    const importsToDisplay = useMemo(() => imports.filter(({ Active }) => Active), [imports]);

    if (importsLoading) {
        return <Loader />;
    }

    if (!importsToDisplay.length) {
        return <Alert>{c('Info').t`No imports in progress`}</Alert>;
    }

    const hasStoragePausedImports = importsToDisplay.some(({ Active }) => {
        if (!Active) {
            return false;
        }
        const { State, ErrorCode } = Active;
        return State === ImportMailStatus.PAUSED && ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT;
    });

    const hasAuthPausedImports = importsToDisplay.some(({ Active }) => {
        if (!Active) {
            return false;
        }
        const { State, ErrorCode } = Active;
        return State === ImportMailStatus.PAUSED && ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;
    });

    const headerCells = [
        { node: c('Title header').t`Import` },
        { node: c('Title header').t`Progress`, className: 'onmobile-w33 onmobile-aligncenter' },
        { node: c('Title header').t`Started`, className: 'nomobile' },
        { node: c('Title header').t`Actions`, className: 'nomobile' },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <>
            {!hasAuthPausedImports && <Alert>{c('Info').t`Check the status of your imports in progress`}</Alert>}
            {hasStoragePausedImports && (
                <Alert type="warning">
                    {c('Info').t`Proton paused an import because your account is running low on space. You can:`}
                    <ul className="m0">
                        <li>{c('Info').t`free up space by deleting older messages or other data`}</li>
                        <li>{c('Info').t`purchase additional storage`}</li>
                    </ul>
                </Alert>
            )}
            {hasAuthPausedImports && (
                <Alert type="warning">
                    {c('Info')
                        .t`Proton paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            )}
            <Table className="onmobile-hideTd3 onmobile-hideTd4">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody>
                    {importsToDisplay.map((currentImport, index) => {
                        const { Email, Active } = currentImport;
                        const { State, ErrorCode, CreateTime, Mapping = [] } = Active || {};

                        const { total, processed } = Mapping.reduce(
                            (acc, { Total = 0, Processed = 0 }) => {
                                acc.total += Total;
                                acc.processed += Processed;
                                return acc;
                            },
                            { total: 0, processed: 0 }
                        );

                        const badgeRenderer = () => {
                            const percentage = (processed * 100) / total;
                            const percentageValue = Number.isNaN(percentage) ? 0 : Math.round(percentage);

                            let badge = <Badge>{c('Import status').t`${percentageValue}% imported`}</Badge>;

                            if (State === ImportMailStatus.PAUSED) {
                                badge = (
                                    <>
                                        <Badge type="warning">{c('Import status').t`${percentageValue}% paused`}</Badge>

                                        {ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION && (
                                            <Tooltip title={c('Tooltip').t`Account is disconnected`}>
                                                <Icon name="attention-plain" />
                                            </Tooltip>
                                        )}
                                        {ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT && (
                                            <Tooltip title={c('Tooltip').t`Your ProtonMail inbox is almost full`}>
                                                <Icon name="attention-plain" />
                                            </Tooltip>
                                        )}
                                    </>
                                );
                            }

                            if (State === ImportMailStatus.QUEUED) {
                                badge = <Badge type="origin">{c('Import status').t`Queued`}</Badge>;
                            }

                            if (State === ImportMailStatus.CANCELED) {
                                badge = <Badge type="origin">{c('Import status').t`Canceling`}</Badge>;
                            }

                            return <div className="onmobile-aligncenter">{badge}</div>;
                        };

                        return (
                            <TableRow
                                key={index}
                                cells={[
                                    <>
                                        <div key="email" className="w100 ellipsis">
                                            {Email}
                                        </div>
                                            <time key="importDate" className="nodesktop notablet">
                                                {format(CreateTime * 1000, 'PPp')}
                                            </time>
                                    </>,
                                    badgeRenderer(),
                                    <time key="importDate">{format(CreateTime * 1000, 'PPp')}</time>,
                                    <RowActions key="actions" currentImport={currentImporter} />,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default CurrentImportsSection;
