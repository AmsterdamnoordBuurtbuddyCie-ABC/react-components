import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    EmailInput,
    Input,
    IntlTelInput,
    InlineLinkButton,
    PrimaryButton,
    Alert,
    useApi,
    useLoading,
    useModals,
    useNotifications
} from 'react-components';
import { queryVerificationCode } from 'proton-shared/lib/api/user';
import { isNumber, isEmail } from 'proton-shared/lib/helpers/validators';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { c } from 'ttag';

import RequestNewCodeModal from './RequestNewCodeModal';
import InvalidVerificationCodeModal from './InvalidVerificationCodeModal';

const STEPS = {
    ENTER_DESTINATION: 0,
    VERIFY_CODE: 1
};

const METHODS = {
    EMAIL: 'email',
    SMS: 'sms'
};

const CodeVerification = ({ email: defaultEmail = '', method, onSubmit }) => {
    const isEmailMethod = method === METHODS.EMAIL;
    const isSmsMethod = method === METHODS.SMS;
    const inputCodeRef = useRef();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState(defaultEmail);
    const [phone, setPhone] = useState();
    const [code, setCode] = useState('');
    const codeError = !code
        ? c('Input error').t`This field is required`
        : code.length < 6
        ? c('Error').t`The code is not the right length`
        : '';
    const [step, setStep] = useState(STEPS.ENTER_DESTINATION);
    const api = useApi();
    const [loadingCode, withLoadingCode] = useLoading();
    const [loadingVerification, withLoadingVerification] = useLoading();
    const { createModal } = useModals();

    const sendCode = async () => {
        await api(queryVerificationCode(method, isEmailMethod ? { Address: email } : { Phone: phone }));
        setCode('');
        setStep(STEPS.VERIFY_CODE);
        createNotification({ text: c('Success').t`Code sent to ${isEmailMethod ? email : phone}` });
        inputCodeRef.current.focus();
    };

    const alreadyHaveCode = () => {
        setCode('');
        setStep(STEPS.VERIFY_CODE);
        inputCodeRef.current.focus();
    };

    const editDestination = () => {
        setStep(STEPS.ENTER_DESTINATION);
    };

    const verifyCode = async () => {
        try {
            await onSubmit(`${isEmailMethod ? email : phone}:${code}`);
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createModal(
                    <InvalidVerificationCodeModal
                        onEdit={editDestination}
                        onResend={() => withLoadingCode(sendCode())}
                    />
                );
            }
        }
    };

    useEffect(() => {
        setStep(STEPS.ENTER_DESTINATION);
    }, [method]);

    if (step === STEPS.ENTER_DESTINATION && isEmailMethod) {
        const handleChangeEmail = (event) => {
            event.preventDefault();

            if (event.key === 'Enter') {
                return withLoadingCode(sendCode());
            }

            setEmail(event.target.value);
        };
        return (
            <>
                <label htmlFor="email" className="bl mb0-5">{c('Label').t`Email address`}</label>
                <div className="mb1">
                    <EmailInput
                        id="email"
                        autoFocus={true}
                        value={email}
                        placeholder={c('Placeholder').t`Enter an email address`}
                        onChange={handleChangeEmail}
                        required
                    />
                </div>
                <div className="alignright">
                    <InlineLinkButton onClick={alreadyHaveCode} className="mr1">{c('Action')
                        .t`I already have a code`}</InlineLinkButton>
                    <PrimaryButton
                        disabled={!email || !isEmail(email)}
                        loading={loadingCode}
                        onClick={() => withLoadingCode(sendCode())}
                    >{c('Action').t`Send code`}</PrimaryButton>
                </div>
            </>
        );
    }

    if (step === STEPS.ENTER_DESTINATION && isSmsMethod) {
        const handleChangePhone = (status, value, countryData, number) => setPhone(number);
        return (
            <>
                <label htmlFor="phone" className="bl mb0-5">{c('Label').t`Phone number`}</label>
                <div className="mb1">
                    <IntlTelInput
                        id="phone"
                        autoFocus={true}
                        value={phone}
                        containerClassName="w100"
                        inputClassName="w100"
                        dropdownContainer="body"
                        onPhoneNumberChange={handleChangePhone}
                        required
                    />
                </div>
                <div className="alignright">
                    <InlineLinkButton onClick={alreadyHaveCode} className="mr1">{c('Action')
                        .t`I already have a code`}</InlineLinkButton>
                    <PrimaryButton
                        disabled={!phone}
                        loading={loadingCode}
                        onClick={() => withLoadingCode(sendCode())}
                    >{c('Action').t`Send code`}</PrimaryButton>
                </div>
            </>
        );
    }

    if (step === STEPS.VERIFY_CODE) {
        const destinationText = <strong key="destination">{isEmailMethod ? email : phone}</strong>;
        const handleChangeCode = (event) => {
            event.preventDefault();

            if (event.key === 'Enter') {
                return withLoadingVerification(verifyCode());
            }

            const newCode = event.target.value;

            if (!newCode || isNumber(newCode)) {
                setCode(newCode);
            }
        };
        return (
            <>
                {(isEmailMethod ? (
                    email
                ) : (
                    phone
                )) ? (
                    <Alert>
                        <div>{c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}</div>
                        {isEmailMethod ? (
                            <div>{c('Info')
                                .t`If you don't find the email in your inbox, please check your spam folder.`}</div>
                        ) : null}
                    </Alert>
                ) : null}
                <label htmlFor="code" className="bl mb0-5">{c('Label').t`Verification code`}</label>
                <div className="mb0-5">
                    <Input
                        id="code"
                        ref={inputCodeRef}
                        value={code}
                        maxLength="6"
                        placeholder="123456"
                        onChange={handleChangeCode}
                        autoFocus={true}
                        required={true}
                        error={codeError}
                    />
                </div>
                <div className="mb1">
                    <InlineLinkButton
                        onClick={() =>
                            createModal(
                                <RequestNewCodeModal
                                    onEdit={editDestination}
                                    onResend={() => withLoadingCode(sendCode())}
                                    email={email}
                                    phone={phone}
                                />
                            )
                        }
                    >{c('Action').t`Did not receive the code?`}</InlineLinkButton>
                </div>
                <div className="alignright">
                    <InlineLinkButton onClick={editDestination} className="mr1">{c('Action')
                        .t`Change verification`}</InlineLinkButton>
                    <PrimaryButton
                        disabled={codeError}
                        loading={loadingVerification}
                        onClick={() => withLoadingVerification(verifyCode())}
                    >{c('Action').t`Verify`}</PrimaryButton>
                </div>
            </>
        );
    }

    return null;
};

CodeVerification.propTypes = {
    email: PropTypes.string,
    method: PropTypes.oneOf([METHODS.SMS, METHODS.EMAIL]).isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default CodeVerification;
