import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    classnames,
    LossLoyaltyModal,
    Alert,
    GenericError,
    FormModal,
    Payment,
    usePlans,
    useApi,
    useLoading,
    useVPNCountries,
    useEventManager,
    usePayment,
    useUser,
    useNotifications,
    useOrganization,
    useModals
} from 'react-components';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, CYCLE, CURRENCIES, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { checkSubscription, subscribe, deleteSubscription } from 'proton-shared/lib/api/payments';
import { isLoyal } from 'proton-shared/lib/helpers/organization';

import { SUBSCRIPTION_STEPS } from './constants';
import NewSubscriptionSubmitButton from './NewSubscriptionSubmitButton';
import SubscriptionCustomization from './SubscriptionCustomization';
import SubscriptionUpgrade from './SubscriptionUpgrade';
import SubscriptionThanks from './SubscriptionThanks';
import SubscriptionCheckout from './SubscriptionCheckout';
import NewSubscriptionModalFooter from './NewSubscriptionModalFooter';
import PaymentGiftCode from '../PaymentGiftCode';

import './NewSubscriptionModal.scss';
import { handlePaymentToken } from '../paymentTokenHelper';

const clearPlanIDs = (planIDs = {}) => {
    return Object.entries(planIDs).reduce((acc, [planID, quantity]) => {
        if (!quantity) {
            return acc;
        }
        acc[planID] = quantity;
        return acc;
    }, {});
};

const hasPlans = (planIDs = {}) => Object.keys(clearPlanIDs(planIDs)).length;

const NewSubscriptionModal = ({
    expanded = false,
    step: initialStep = SUBSCRIPTION_STEPS.CUSTOMIZATION,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    coupon,
    planIDs = {},
    onClose,
    ...rest
}) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Plan customization`,
        [SUBSCRIPTION_STEPS.PAYMENT]: c('Title').t`Checkout`,
        [SUBSCRIPTION_STEPS.UPGRADE]: <div className="aligncenter">{c('Title').t`Processing...`}</div>,
        [SUBSCRIPTION_STEPS.THANKS]: <div className="aligncenter">{c('Title').t`Thank you!`}</div>
    };

    const api = useApi();
    const [user] = useUser();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [vpnCountries, loadingVpnCountries] = useVPNCountries();
    const [plans, loadingPlans] = usePlans();
    const [organization, loadingOrganization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [checkResult, setCheckResult] = useState({});
    const { Credit = 0 } = checkResult;
    const { Code: couponCode } = checkResult.Coupon || {}; // Coupon can be null
    const creditsRemaining = (user.Credit + Credit) / 100;
    const [model, setModel] = useState({
        cycle,
        currency,
        coupon,
        planIDs
    });
    const [step, setStep] = useState(initialStep);

    const TOTAL_ZERO = {
        Amount: 0,
        AmountDue: 0,
        CouponDiscount: 0,
        Currency: model.currency,
        Cycle: model.cycle,
        Proration: 0,
        Gift: 0,
        Credit: 0
    };

    const handleUnsubscribe = async () => {
        if (isLoyal(organization)) {
            await new Promise((resolve, reject) => {
                createModal(<LossLoyaltyModal user={user} onConfirm={resolve} onClose={reject} />);
            });
        }
        await api(deleteSubscription());
        await call();
        onClose();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleSubscribe = async (params = {}) => {
        if (!hasPlans(model.planIDs)) {
            return handleUnsubscribe();
        }

        try {
            setStep(SUBSCRIPTION_STEPS.UPGRADE);
            await api(
                subscribe({
                    PlanIDs: model.planIDs,
                    CouponCode: model.coupon,
                    GiftCode: model.gift,
                    Cycle: model.cycle,
                    ...params // Contains Payment, Amount and Currency
                })
            );
            await call();
            setStep(SUBSCRIPTION_STEPS.THANKS);
        } catch (error) {
            setStep(SUBSCRIPTION_STEPS.PAYMENT);
            throw error;
        }
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: checkResult.AmountDue,
        currency: checkResult.Currency,
        onPay(params) {
            return withLoading(handleSubscribe(params));
        }
    });

    const check = async (newModel = model) => {
        if (!hasPlans(newModel.planIDs)) {
            setCheckResult(TOTAL_ZERO);
            return;
        }

        try {
            const result = await api(
                checkSubscription({
                    PlanIDs: clearPlanIDs(newModel.planIDs),
                    CouponCode: newModel.coupon,
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    GiftCode: newModel.gift
                })
            );

            const { Code = '' } = result.Coupon || {}; // Coupon can equal null
            const copyNewModel = { ...newModel };

            copyNewModel.coupon = Code;

            if (!result.Gift) {
                delete copyNewModel.gift;
            }

            setModel(copyNewModel);
            setCheckResult(result);
        } catch (error) {
            if (error.name === 'OfflineError') {
                setStep(SUBSCRIPTION_STEPS.NETWORK_ERROR);
            }
        }
    };

    const handleCheckout = async () => {
        if (step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
            return setStep(SUBSCRIPTION_STEPS.PAYMENT);
        }

        const params = await handlePaymentToken({
            params: {
                Amount: checkResult.AmountDue,
                Currency: checkResult.Currency,
                ...parameters
            },
            createModal,
            api
        });

        return handleSubscribe(params);
    };

    const handleClose = (e) => {
        if (step === SUBSCRIPTION_STEPS.PAYMENT) {
            setStep(SUBSCRIPTION_STEPS.CUSTOMIZATION);
            return;
        }

        onClose(e);
    };

    const handleGift = (gift = '') => {
        if (!gift) {
            const withoutGift = { ...model };
            delete withoutGift.gift;
            return withLoadingCheck(check(withoutGift));
        }
        withLoadingCheck(check({ ...model, gift }));
    };

    useEffect(() => {
        withLoadingCheck(check());
    }, [model.cycle, model.planIDs]);

    return (
        <FormModal
            hasClose={step === SUBSCRIPTION_STEPS.CUSTOMIZATION}
            footer={
                [SUBSCRIPTION_STEPS.UPGRADE, SUBSCRIPTION_STEPS.THANKS].includes(step) ? null : (
                    <NewSubscriptionModalFooter
                        onClose={handleClose}
                        submit={
                            <NewSubscriptionSubmitButton
                                canPay={canPay}
                                paypal={paypal}
                                step={step}
                                setStep={setStep}
                                loading={loadingCheck || loading}
                                method={method}
                                checkResult={checkResult}
                                className="flex-item-noshrink"
                            />
                        }
                        plans={plans}
                        step={step}
                        model={model}
                    />
                )
            }
            className={classnames([
                'subscription-modal',
                [SUBSCRIPTION_STEPS.CUSTOMIZATION, SUBSCRIPTION_STEPS.PAYMENT].includes(step) && 'pm-modal--full',
                user.isFree && 'is-free-user'
            ])}
            title={TITLE[step]}
            loading={loading || loadingPlans || loadingVpnCountries || loadingOrganization}
            onSubmit={() => withLoading(handleCheckout())}
            onClose={handleClose}
            {...rest}
        >
            {step === SUBSCRIPTION_STEPS.NETWORK_ERROR && <GenericError />}
            {step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                <div className="flex flex-spacebetween onmobile-flex-column">
                    <div className="w75 onmobile-w100 pr1 onmobile-pr0">
                        <SubscriptionCustomization
                            vpnCountries={vpnCountries}
                            loading={loadingCheck}
                            plans={plans}
                            expanded={expanded}
                            model={model}
                            setModel={setModel}
                        />
                    </div>
                    <div className="w25 onmobile-w100">
                        <SubscriptionCheckout
                            submit={
                                <NewSubscriptionSubmitButton
                                    canPay={canPay}
                                    paypal={paypal}
                                    step={step}
                                    setStep={setStep}
                                    loading={loadingCheck || loading}
                                    method={method}
                                    checkResult={checkResult}
                                    className="w100"
                                />
                            }
                            plans={plans}
                            checkResult={checkResult}
                            loading={loadingCheck}
                            onCheckout={() => withLoading(handleCheckout())}
                            model={model}
                            setModel={setModel}
                        />
                        <PaymentGiftCode gift={model.gift} onApply={handleGift} loading={loadingCheck} />
                    </div>
                </div>
            )}
            {step === SUBSCRIPTION_STEPS.PAYMENT && (
                <div className="flex flex-spacebetween onmobile-flex-column">
                    <div className="w75 onmobile-w100 pr1 onmobile-pr0">
                        <h3>{c('Title').t`Payment method`}</h3>
                        {checkResult.AmountDue ? (
                            <>
                                <Alert>{c('Info')
                                    .t`You can use any of your saved payment methods or add a new one.`}</Alert>
                                <Payment
                                    type="subscription"
                                    paypal={paypal}
                                    paypalCredit={paypalCredit}
                                    method={method}
                                    amount={checkResult.AmountDue}
                                    currency={checkResult.Currency}
                                    coupon={couponCode}
                                    card={card}
                                    onMethod={setMethod}
                                    onCard={setCard}
                                    errors={errors}
                                />
                                {[PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method) ? (
                                    <Alert type="warning">{c('Warning')
                                        .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Alert>{c('Info').t`No payment is required at this time.`}</Alert>
                                {Credit && creditsRemaining ? (
                                    <Alert>{c('Info')
                                        .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</Alert>
                                ) : null}
                            </>
                        )}
                    </div>
                    <div className="w25 onmobile-w100">
                        <SubscriptionCheckout
                            method={method}
                            submit={
                                <NewSubscriptionSubmitButton
                                    canPay={canPay}
                                    paypal={paypal}
                                    step={step}
                                    setStep={setStep}
                                    loading={loadingCheck || loading}
                                    method={method}
                                    checkResult={checkResult}
                                    className="w100"
                                />
                            }
                            plans={plans}
                            checkResult={checkResult}
                            loading={loadingCheck}
                            onCheckout={() => withLoading(handleCheckout())}
                            model={model}
                            setModel={setModel}
                        />
                        {checkResult.Amount ? (
                            <PaymentGiftCode gift={model.gift} onApply={handleGift} loading={loadingCheck} />
                        ) : null}
                    </div>
                </div>
            )}
            {step === SUBSCRIPTION_STEPS.UPGRADE && <SubscriptionUpgrade />}
            {step === SUBSCRIPTION_STEPS.THANKS && <SubscriptionThanks method={method} onClose={onClose} />}
        </FormModal>
    );
};

NewSubscriptionModal.propTypes = {
    expanded: PropTypes.bool,
    step: PropTypes.oneOf([
        SUBSCRIPTION_STEPS.CUSTOMIZATION,
        SUBSCRIPTION_STEPS.PAYMENT,
        SUBSCRIPTION_STEPS.UPGRADE,
        SUBSCRIPTION_STEPS.THANKS
    ]),
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]),
    currency: PropTypes.oneOf(CURRENCIES),
    coupon: PropTypes.string,
    planIDs: PropTypes.object,
    onClose: PropTypes.func
};

export default NewSubscriptionModal;
