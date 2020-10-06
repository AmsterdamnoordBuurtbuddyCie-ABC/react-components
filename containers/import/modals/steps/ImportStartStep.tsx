import { randomHexString4 } from 'proton-shared/lib/helpers/uid';
import React, { ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';

import { Alert, Row, Label, Field, PasswordInput, EmailInput, Input, Href } from '../../../../components';

import {
    IMAPS,
    INVALID_CREDENTIALS_ERROR_LABEL,
    IMAP_AUTHENTICATION_ERROR_LABEL,
    IMAP_CONNECTION_ERROR_LABEL,
} from '../../constants';

import { ImportMail, ImportMailError, ImportModalModel, IMPORT_ERROR } from '../../interfaces';

interface Props {
    modalModel: ImportModalModel;
    updateModalModel: (newModel: ImportModalModel) => void;
    needAppPassword: boolean;
    showPassword: boolean;
    currentImport?: ImportMail;
}

const ImportStartStep = ({ modalModel, updateModalModel, needAppPassword, showPassword, currentImport }: Props) => {
    const { email, password, needIMAPDetails, imap, port, errorCode, errorLabel } = modalModel;

    useEffect(() => {
        if (!email) {
            updateModalModel({ ...modalModel, password: '', port: '', imap: '' });
        }
    }, [email]);

    const isAuthError = [INVALID_CREDENTIALS_ERROR_LABEL, IMAP_AUTHENTICATION_ERROR_LABEL].includes(errorLabel);
    const isIMAPError = errorLabel === IMAP_CONNECTION_ERROR_LABEL;
    const isReconnect = currentImport && currentImport.ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

    const isGmail = modalModel.imap === IMAPS.GMAIL;
    const isYahoo = modalModel.imap === IMAPS.YAHOO;

    const renderError = () => {
        let message = null;

        if (isReconnect) {
            message = (
                <>
                    <div className="mb1">
                        {c('Import error').t`Proton can't connect to your account. Please make sure that:`}
                    </div>
                    <ul className="m0 pb1">
                        <li>{c('Import error').t`IMAP access is enabled in your external account`}</li>
                        <li>{c('Import error').t`your password is correct`}</li>
                    </ul>
                    <div className="mb1">{c('Import error').t`Use your app password if:`}</div>
                    <ul className="m0 pb1">
                        <li>{c('Import error').t`2-step verification is enabled in your external account`}</li>
                        <li>{c('Import error').t`your email account requires one to export your data`}</li>
                    </ul>
                </>
            );

            if (isGmail) {
                message = (
                    <>
                        <div className="mb1">{c('Import error')
                            .t`Proton can't connect to your account. Please make sure that Gmail IMAP access is enabled.`}</div>
                        <div className="mb1">
                            {c('Import error').jt`If ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`2-step verification is disabled`}</strong>
                            )} in Gmail (default settings), please make sure that:`}
                        </div>
                        <ul className="m0 pb1">
                            <li>{c('Import error').t`your password is correct`}</li>
                            <li>{c('Import error')
                                .t`"Less secure app access" is turned on in your Google account security settings`}</li>
                        </ul>
                        <div className="mb1">
                            {c('Import error').jt`If ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`2-step verification is enabled`}</strong>
                            )} in Gmail, please make sure that you are using your app password instead of your regular password.`}
                        </div>
                        <div className="mb1">
                            {c('Import error').jt`You can also try to sign out of ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`all your other Google accounts`}</strong>
                            )} in the browser, then unlock ${(
                                <Href key={randomHexString4()} url="https://accounts.google.com/DisplayUnlockCaptcha">
                                    {c('Import error emphasis').t`CAPTCHA`}
                                </Href>
                            )}.`}
                        </div>
                    </>
                );
            }

            if (isYahoo) {
                message = (
                    <>
                        <div className="mb1">
                            {c('Import error')
                                .t`Proton can't connect to your Yahoo Mail account. Please make sure that:`}
                        </div>
                        <ul className="m0 pb1">
                            <li>{c('Import error').t`IMAP access is enabled in your Yahoo account.`}</li>
                            <li>{c('Import error').jt`your app password is correct. Do ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis').t`not`}</strong>
                            )} use your regular password.
                            `}</li>
                        </ul>
                    </>
                );
            }
        }

        if (isIMAPError) {
            message = (
                <>
                    <div className="mb1">
                        {c('Import error').t`Proton can't connect to your external account. Please make sure that:`}
                    </div>
                    <ul className="m0 pb1">
                        <li>{c('Import error').t`IMAP access is enabled in your external account`}</li>
                        <li>{c('Import error').t`the mail server address and port number are correct`}</li>
                    </ul>
                </>
            );

            if (isGmail) {
                message = (
                    <>
                        <div className="mb1">
                            {c('Import error').t`Proton can't connect to your Gmail account. Please make sure that:`}
                        </div>
                        <ul className="m0 pb1">
                            <li>{c('Import error').t`IMAP access is enabled in Gmail`}</li>
                            <li>{c('Import error').t`the mail server address and port number are correct`}</li>
                        </ul>
                    </>
                );
            }

            if (isYahoo) {
                message = (
                    <>
                        <div className="mb1">
                            {c('Import error')
                                .t`Proton can't connect to your Yahoo Mail account. Please make sure that:`}
                        </div>
                        <ul className="m0 pb1">
                            <li>{c('Import error').t`IMAP access is enabled in Yahoo Mail`}</li>
                            <li>{c('Import error').t`the mail server address and port number are correct`}</li>
                        </ul>
                    </>
                );
            }
        }

        if (isAuthError) {
            message = (
                <>
                    <div className="mb1">
                        {c('Import error')
                            .t`Proton can't connect to your external account. Please make sure that your email address and password are correct.`}
                    </div>
                    <div className="mb1">
                        {c('Import error').t`Use your app password instead of your regular password if:`}
                    </div>
                    <ul className="m0 pb1">
                        <li>{c('Import error').t`2-step verification is enabled in your external email account`}</li>
                        <li>{c('Import error').t`your email account requires an app password to export your data`}</li>
                    </ul>
                </>
            );

            if (isGmail) {
                message = (
                    <>
                        <div className="mb1">{c('Import error').t`Proton can't connect to your Gmail account.`}</div>
                        <div className="mb1">
                            {c('Import error').jt`If ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`2-step verification is disabled`}</strong>
                            )} in Gmail (default settings), please make sure that:`}
                        </div>
                        <ul className="m0 pb1">
                            <li>{c('Import error').t`your email address and password are correct`}</li>
                            <li>{c('Import error')
                                .t`"Less secure app access" is turned on in your Google account security settings`}</li>
                        </ul>
                        <div className="mb1">
                            {c('Import error').jt`If ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`2-step verification is enabled`}</strong>
                            )} in Gmail, please make sure that your email address and app password are correct. Do ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis').t`not`}</strong>
                            )} use your regular password.`}
                        </div>
                        <div className="mb1">
                            {c('Import error').jt`You can also try to sign out of ${(
                                <strong key={randomHexString4()}>{c('Import error emphasis')
                                    .t`all your other Google accounts`}</strong>
                            )} in the browser, then unlock ${(
                                <Href key={randomHexString4()} url="https://accounts.google.com/DisplayUnlockCaptcha">
                                    {c('Import error emphasis').t`CAPTCHA`}
                                </Href>
                            )}.`}
                        </div>
                    </>
                );
            }

            if (isYahoo) {
                message = (
                    <div className="mb1">
                        {c('Import error')
                            .jt`Proton can't connect to your Yahoo Mail account. Please make sure that your email address and app password are correct. Do ${(
                            <strong key={randomHexString4()}>{c('Import error emphasis').t`not`}</strong>
                        )} use your regular password.`}
                    </div>
                );
            }
        }

        return (
            <Alert type="error" learnMore="https://protonmail.com/support/knowledge-base/">
                {message}
            </Alert>
        );
    };

    return (
        <>
            {isReconnect || [IMPORT_ERROR.AUTH_IMAP, IMPORT_ERROR.AUTH_CREDENTIALS].includes(errorCode) ? (
                renderError()
            ) : (
                <>
                    <Alert>{c('Info').t`Enter the credentials of the email account you want to import from.`}</Alert>
                    {showPassword && (
                        <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/">
                            {c('Warning')
                                .t`By sharing your login credentials, you are giving Proton permission to fetch data from your external email provider. We will delete your login information once the import is complete.`}
                        </Alert>
                    )}
                </>
            )}

            <Row>
                <Label htmlFor="emailAddress">{c('Label').t`Email`}</Label>
                <Field>
                    <EmailInput
                        id="emailAddress"
                        value={email}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            updateModalModel({ ...modalModel, email: target.value })
                        }
                        autoFocus
                        required
                        disabled={isReconnect}
                        isSubmitted={!!errorLabel}
                        error={isAuthError ? errorLabel : undefined}
                        errorZoneClassName="hidden"
                    />
                </Field>
            </Row>

            {showPassword && (
                <Row>
                    <Label htmlFor="password">
                        {needAppPassword ? c('Label').t`App password` : c('Label').t`Password`}
                    </Label>
                    <Field>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                updateModalModel({ ...modalModel, password: target.value })
                            }
                            autoFocus
                            required
                            isSubmitted={!!errorLabel}
                            error={isAuthError ? errorLabel : undefined}
                            errorZoneClassName="hidden"
                        />
                    </Field>
                </Row>
            )}

            {needIMAPDetails && email && showPassword && (
                <>
                    <Row>
                        <Label htmlFor="imap">{c('Label').t`Mail Server (IMAP)`}</Label>
                        <Field>
                            <Input
                                id="imap"
                                placeholder="imap.domain.com"
                                value={imap}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    updateModalModel({ ...modalModel, imap: target.value })
                                }
                                required
                                isSubmitted={!!errorLabel}
                                error={isIMAPError ? errorLabel : undefined}
                                errorZoneClassName="hidden"
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="port">{c('Label').t`Port`}</Label>
                        <Field>
                            <Input
                                id="port"
                                placeholder="993"
                                value={port}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    updateModalModel({ ...modalModel, port: target.value })
                                }
                                required
                                isSubmitted={!!errorLabel}
                                error={isIMAPError ? errorLabel : undefined}
                                errorZoneClassName="hidden"
                            />
                        </Field>
                    </Row>
                </>
            )}
        </>
    );
};

export default ImportStartStep;
