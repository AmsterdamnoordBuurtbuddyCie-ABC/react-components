import React from 'react';
import PropTypes from 'prop-types';
import { LinkButton, useToggle, Price, Icon } from 'react-components';
import { c } from 'ttag';
import { CURRENCIES, CYCLE } from 'proton-shared/lib/constants';

const SubscriptionPlan = ({
    canCustomize = false,
    expanded = false,
    features = [],
    addons = [],
    description,
    plan,
    currency
}) => {
    const { state, toggle } = useToggle(expanded);

    return (
        <>
            <div className="bordered-container inline-flex flex-nowrap onmobile-flex-column mb1">
                <div className="p1" style={{ width: '230px' }}>
                    <div className="bold mb1">{c('Title').t`Plan summary`}</div>
                    <ul className="unstyled mb1">
                        {features.map((feature, index) => {
                            return <li key={index}>{feature}</li>;
                        })}
                    </ul>
                </div>
                {canCustomize && state ? (
                    <div className="border-left p1" style={{ width: '370px' }}>
                        <div className="flex flex-nowrap flex-items-center flex-spacebetween mb1">
                            <div className="bold">{c('Title').t`Configure plan`}</div>
                            <Price className="big mt0 mb0" currency={currency} suffix={c('Suffix').t`/month`}>
                                {plan.Pricing[CYCLE.MONTHLY]}
                            </Price>
                        </div>
                        <div className="flex flex-column">
                            <div className="flex-item-fluid-auto">{addons.map((addon) => addon)}</div>
                            {description ? <div>{description}</div> : null}
                        </div>
                    </div>
                ) : null}
            </div>
            {canCustomize ? (
                <div className="mb1">
                    <LinkButton className="flex flex-nowrap flex-items-center" onClick={toggle}>
                        <Icon name="caret" className={state ? 'rotateZ-90' : 'rotateZ-270'} />
                        <span>
                            {state
                                ? c('Action').t`Hide customization options`
                                : c('Action').t`Show customization options`}
                        </span>
                    </LinkButton>
                </div>
            ) : null}
        </>
    );
};

SubscriptionPlan.propTypes = {
    canCustomize: PropTypes.bool,
    expanded: PropTypes.bool,
    features: PropTypes.arrayOf(PropTypes.node),
    addons: PropTypes.arrayOf(PropTypes.node),
    currency: PropTypes.oneOf(CURRENCIES),
    plan: PropTypes.object.isRequired,
    description: PropTypes.string
};

export default SubscriptionPlan;
