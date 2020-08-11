import React, { FunctionComponent, useEffect, useState } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';

import { getActiveSessions, resumeSession } from 'proton-shared/lib/authentication/helper';
import { InvalidPersistentSessionError } from 'proton-shared/lib/authentication/error';
import { LocalSessionResponse } from 'proton-shared/lib/authentication/interface';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { APP_NAMES, APPS_CONFIGURATION } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { withUIDHeaders } from 'proton-shared/lib/fetch/headers';
import { revoke } from 'proton-shared/lib/api/auth';
import { getPersistedSession, removePersistedSession } from 'proton-shared/lib/authentication/session';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import {
    useApi,
    useLoading,
    LinkButton,
    OnLoginCallbackArguments,
    Loader,
    useNotifications,
    LoaderIcon,
} from '../../index';
import { Props as AccountLayoutProps } from '../signup/AccountPublicLayout';

interface Props {
    Layout: FunctionComponent<AccountLayoutProps>;
    onLogin: (data: OnLoginCallbackArguments) => Promise<void>;
    toAppNameKey: APP_NAMES;
    activeSessions?: LocalSessionResponse[];
}

const AccountSwitchContainer = ({ Layout, toAppNameKey, onLogin, activeSessions }: Props) => {
    const history = useHistory();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const [localActiveSessions, setLocalActiveSessions] = useState(activeSessions);
    const [loading, withLoading] = useLoading(!localActiveSessions);
    const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState(false);
    const { createNotification } = useNotifications();

    const toAppName = APPS_CONFIGURATION[toAppNameKey].name;

    useEffect(() => {
        if (!activeSessions) {
            const run = async () => {
                const { sessions } = await getActiveSessions(silentApi);
                setLocalActiveSessions(sessions);
            };
            withLoading(run().catch(() => setError(true)));
        }
    }, []);

    const handleSignOutAll = async () => {
        localActiveSessions?.map(({ LocalID }) => {
            const persistedSession = getPersistedSession(LocalID);
            removePersistedSession(LocalID);
            if (persistedSession && persistedSession.UID) {
                return silentApi(withUIDHeaders(persistedSession.UID, revoke()));
            }
        });
        history.push('/login');
    };

    const handleAddAccount = () => {
        history.push('/login');
    };

    const handleClickSession = async (localID: number) => {
        try {
            setLoadingMap((old) => ({ ...old, [localID]: true }));
            await wait(1000);
            const validatedSession = await resumeSession(silentApi, localID);
            await onLogin({
                LocalID: localID,
                keyPassword: validatedSession.keyPassword,
                UID: validatedSession.UID,
            });
        } catch (e) {
            if (e instanceof InvalidPersistentSessionError) {
                setLocalActiveSessions((list) => {
                    return list?.filter(({ LocalID: otherLocalID }) => otherLocalID !== localID);
                });
                createNotification({
                    type: 'error',
                    text: c('Error').t`The session has expired. Please sign in again.`,
                });
                return;
            }
            const errorMessage = getApiErrorMessage(e) || 'Unknown error';
            createNotification({ type: 'error', text: errorMessage });
            console.error(error);
        } finally {
            setLoadingMap((old) => ({ ...old, [localID]: true }));
        }
    };

    const listItemClassName = 'flex flex-items-center w100 pl1 pr1 pt0-75 pb0-75 border-bottom alignleft';

    const inner = () => {
        if (error) {
            return (
                <div className={listItemClassName}>{c('Error')
                    .t`Failed to get active sessions. Please refresh or try again later.`}</div>
            );
        }
        if (loading) {
            return <Loader />;
        }
        if (!localActiveSessions?.length) {
            return <div className={listItemClassName}>{c('Error').t`No active sessions`}</div>;
        }
        return localActiveSessions.map(({ DisplayName, Username, LocalID, PrimaryEmail }) => {
            const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
            const initials = getInitial(nameToDisplay);
            return (
                <button
                    key={LocalID}
                    className={`${listItemClassName} button-showOnHover button-account`}
                    onClick={() => handleClickSession(LocalID)}
                >
                    <span className="dropDown-logout-initials rounded p0-25 inline-flex bg-global-grey color-white">
                        <span className="dropDown-logout-text center semibold">{initials}</span>
                    </span>
                    <span className="flex-item-fluid flex flex-column pl1 pr1">
                        <span className="semibold">{nameToDisplay}</span>
                        <span className="">{PrimaryEmail}</span>
                    </span>
                    <span className="flex-item-noshrink">
                        <span className="nonvisible button-showOnHover-element button-account-login semibold small m0">
                            {loadingMap[LocalID] ? <LoaderIcon /> : c('Action').t`Login`}
                        </span>
                    </span>
                </button>
            );
        });
    };

    return (
        <Layout
            title={c('Title').t`Choose an account`}
            right={
                <LinkButton className="nodecoration" onClick={handleSignOutAll}>{c('Action')
                    .t`Sign out all accounts`}</LinkButton>
            }
        >
            <p>{c('Info').t`To continue to ${toAppName}`}</p>
            <div className="tiny-shadow-container button-account-container">
                {inner()}
                <div className="relative p1">
                    <LinkButton className="semibold nodecoration increase-surface-click" onClick={handleAddAccount}>{c(
                        'Action'
                    ).t`Add account`}</LinkButton>
                </div>
            </div>
        </Layout>
    );
};

export default AccountSwitchContainer;
