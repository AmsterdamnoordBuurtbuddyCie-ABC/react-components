import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    SubTitle,
    LinkButton,
    Href,
    Loader,
    MozillaInfoPanel,
    Meter,
    useModals,
    useSubscription,
    useOrganization,
    useUser,
    useAddresses
} from 'react-components';
import { PLAN_NAMES } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { identity } from 'proton-shared/lib/helpers/function';
import { getPlanIDs } from 'proton-shared/lib/helpers/subscription';

import { formatPlans } from './helpers';
import UpsellSubscription from './UpsellSubscription';
import NewSubscriptionModal from './NewSubscriptionModal';
import UnsubscribeButton from './UnsubscribeButton';

const AddonRow = ({ label, used, max, format = identity }) => {
    return (
        <div className="flex-autogrid onmobile-flex-column w100 mb1">
            <div className="flex-autogrid-item pl1">{label}</div>
            <div className="flex-autogrid-item">
                <strong>
                    {Number.isInteger(used) ? `${format(used)} ${c('x of y').t`of`} ${format(max)}` : format(max)}
                </strong>
            </div>
            <div className="flex-autogrid-item">
                {Number.isInteger((used * 100) / max) ? (
                    <Meter value={(used * 100) / max} className="setting-meterbar" />
                ) : null}
            </div>
        </div>
    );
};

AddonRow.propTypes = {
    label: PropTypes.string.isRequired,
    used: PropTypes.number,
    max: PropTypes.number.isRequired,
    format: PropTypes.func
};

const SubscriptionSection = ({ permission }) => {
    const [{ hasPaidMail, hasPaidVpn, isPaid }] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const [organization, loadingOrganization] = useOrganization();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    const subTitle = <SubTitle>{c('Title').t`Subscription`}</SubTitle>;

    if (!permission) {
        return (
            <>
                {subTitle}
                <Alert>{c('Info').t`No subscription yet`}</Alert>
            </>
        );
    }

    if (loadingSubscription || loadingOrganization || loadingAddresses) {
        return (
            <>
                {subTitle}
                <Loader />
            </>
        );
    }

    const { Plans = [], Cycle, CouponCode, Currency, isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return (
            <>
                {subTitle}
                <MozillaInfoPanel />
            </>
        );
    }

    const {
        UsedDomains,
        MaxDomains,
        UsedSpace,
        MaxSpace,
        UsedAddresses,
        MaxAddresses,
        UsedMembers,
        MaxMembers,
        MaxVPN
    } = organization || {};

    const { mailPlan, vpnPlan } = formatPlans(Plans);
    const { Name: mailPlanName } = mailPlan || {};
    const { Name: vpnPlanName } = vpnPlan || {};

    const handleModal = () => {
        createModal(
            <NewSubscriptionModal
                planIDs={getPlanIDs(subscription)}
                coupon={CouponCode || undefined} // CouponCode can equal null
                currency={Currency}
                cycle={Cycle}
            />
        );
    };

    const mailAddons = [
        hasPaidMail && { label: c('Label').t`Users`, used: UsedMembers, max: MaxMembers },
        hasPaidMail && { label: c('Label').t`Email addresses`, used: UsedAddresses, max: MaxAddresses },
        hasPaidMail && {
            label: c('Label').t`Storage capacity`,
            used: UsedSpace,
            max: MaxSpace,
            humanSize,
            format: (v) => humanSize(v)
        },
        hasPaidMail && { label: c('Label').t`Custom domains`, used: UsedDomains, max: MaxDomains },
        mailPlanName === 'visionary' && { label: c('Label').t`VPN connections`, max: MaxVPN }
    ].filter(Boolean);

    const vpnAddons = [
        hasPaidVpn
            ? { label: c('Label').t`VPN connections`, max: MaxVPN }
            : { label: c('Label').t`VPN connections`, max: 1 }
    ];

    return (
        <>
            {subTitle}
            <Alert>{c('Info')
                .t`To manage your subscription, including billing frequency and currency, or to switch to another plan, click on Manage subscription.`}</Alert>
            <div className="shadow-container mb1">
                <div className="border-bottom pt1 pl1 pr1 onmobile-pb1">
                    <div className="flex-autogrid flex-items-center onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">ProtonMail plan</div>
                        <div className="flex-autogrid-item">
                            <strong>
                                {hasPaidMail ? (
                                    PLAN_NAMES[mailPlanName]
                                ) : hasAddresses ? (
                                    c('Plan').t`Free`
                                ) : (
                                    <Href url="https://mail.protonmail.com/login">{c('Info').t`Not activated`}</Href>
                                )}
                            </strong>
                        </div>
                        <div className="flex-autogrid-item">
                            {hasAddresses || mailPlanName === 'visionary' ? (
                                <LinkButton onClick={handleModal}>{c('Action').t`Manage subscription`}</LinkButton>
                            ) : null}
                        </div>
                    </div>
                    {mailAddons.map((props, index) => (
                        <AddonRow key={index} {...props} />
                    ))}
                </div>
                {mailPlanName === 'visionary' ? null : (
                    <div className="pt1 pl1 pr1">
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonVPN plan</div>
                            <div className="flex-autogrid-item">
                                <strong>{hasPaidVpn ? PLAN_NAMES[vpnPlanName] : c('Plan').t`Free`}</strong>
                            </div>
                            <div className="flex-autogrid-item">
                                <LinkButton onClick={handleModal}>{c('Action').t`Manage subscription`}</LinkButton>
                            </div>
                        </div>
                        {vpnAddons.map((props, index) => (
                            <AddonRow key={index} {...props} />
                        ))}
                    </div>
                )}
                {isPaid ? (
                    <div className="pl1 pr1 pt0-5 pb0-5">
                        <UnsubscribeButton className="pm-button--link pm-button--redborder">{c('Action')
                            .t`Cancel subscription`}</UnsubscribeButton>
                    </div>
                ) : null}
            </div>
            <UpsellSubscription />
        </>
    );
};

SubscriptionSection.propTypes = {
    permission: PropTypes.bool
};

export default SubscriptionSection;
