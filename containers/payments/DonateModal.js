import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Label, FormModal, Row, Field, Alert, useNotifications, useApi, useLoading, useModals } from 'react-components';
import { donate } from 'proton-shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_DONATION_AMOUNT } from 'proton-shared/lib/constants';

import PaymentSelector from './PaymentSelector';
import Payment from './Payment';
import usePayment from './usePayment';
import { handlePaymentToken } from './paymentTokenHelper';

const DonateModal = ({ ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);
    const { createModal } = useModals();

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: amount, Currency: currency },
            api,
            createModal
        });
        await api(donate(requestBody));
        rest.onClose();
        createNotification({
            text: c('Success')
                .t`Your support is essential to keeping Proton running. Thank you for supporting internet privacy!`
        });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount,
        currency,
        onPay: handleSubmit
    });

    return (
        <FormModal
            onSubmit={() => withLoading(handleSubmit(parameters))}
            loading={loading}
            title={c('Title').t`Make a donation`}
            submit={canPay && c('Action').t`Donate`}
            {...rest}
        >
            <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>
            <Row>
                <Label>{c('Label').t`Amount`}</Label>
                <Field>
                    <PaymentSelector
                        amount={amount}
                        onChangeAmount={setAmount}
                        currency={currency}
                        onChangeCurrency={setCurrency}
                    />
                </Field>
            </Row>
            <Payment
                type="donation"
                method={method}
                amount={amount}
                currency={currency}
                card={card}
                onMethod={setMethod}
                onCard={setCard}
                errors={errors}
                paypal={paypal}
                paypalCredit={paypalCredit}
            />
        </FormModal>
    );
};

DonateModal.propTypes = {
    onClose: PropTypes.func
};

export default DonateModal;
