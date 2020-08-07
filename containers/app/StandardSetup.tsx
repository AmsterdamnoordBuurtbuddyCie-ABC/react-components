import React, { FunctionComponent } from 'react';
import { APPS, isSSOMode, isStandaloneMode, SSO_FORK_PATH } from 'proton-shared/lib/constants';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { Route, Switch } from 'react-router-dom';
import { replaceUrl } from 'proton-shared/lib/helpers/browser';
import { getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import StandalonePublicApp from './StandalonePublicApp';
import { Loader, useAuthentication, useConfig } from '../../index';
import { PrivateAuthenticationStore, PublicAuthenticationStore } from './interface';
import SSOPublicApp from './SSOPublicApp';
import SSOForkConsumer from './SSOForkConsumer';

const ReplaceToBase = () => {
    document.location.replace(document.location.origin);
    return <Loader />;
};

interface Props {
    locales: TtagLocaleMap;
    PrivateApp: FunctionComponent<{ onLogout: () => void; locales: TtagLocaleMap }>;
}

const StandardSetup = ({ locales, PrivateApp }: Props) => {
    const { APP_NAME } = useConfig();

    const { UID, logout, login } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;

    if (UID) {
        return <PrivateApp locales={locales} onLogout={logout} />;
    }

    if (isSSOMode) {
        const handleInvalidFork = () => {
            // Fork invalid, so just fall back to the account page.
            return replaceUrl(getAppHref('/', APPS.PROTONACCOUNT));
        };
        const handleInactiveSession = (localID?: number) => {
            return requestFork(APP_NAME, localID);
        };
        return (
            <Switch>
                <Route path={SSO_FORK_PATH}>
                    <SSOForkConsumer onInvalidFork={handleInvalidFork} onLogin={login} />
                </Route>
                <Route path="*">
                    <SSOPublicApp onLogin={login} onInactiveSession={handleInactiveSession} />
                </Route>
            </Switch>
        );
    }

    if (isStandaloneMode || document.location.pathname === '/') {
        return <StandalonePublicApp locales={locales} onLogin={login} />;
    }

    return <ReplaceToBase />;
};

export default StandardSetup;