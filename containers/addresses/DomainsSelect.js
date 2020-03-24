import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { useApi, useLoading, useUser, useDomains, Select, usePremiumDomains } from 'react-components';

import { fakeEvent } from '../../helpers/component';

const DomainsSelect = ({ member, onChange, domain: initDomain = '', disabled, className }) => {
    const api = useApi();
    const [user] = useUser();
    const [domains, loadingDomains] = useDomains();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const [loading, withLoading] = useLoading();

    const [options, setOptions] = useState([]);
    const [domain, setDomain] = useState(initDomain);

    const handleChange = (event) => {
        setDomain(event.target.value);
        onChange(event);
    };

    const formatDomains = (domains = []) =>
        domains.reduce((acc, { State, DomainName }) => {
            State && acc.push(DomainName);
            return acc;
        }, []);

    const queryDomains = async () => {
        const premium = member.Self && user.hasPaidMail ? premiumDomains : [];
        const available = member.Self ? await api(queryAvailableDomains()).then(({ Domains }) => Domains) : [];
        const domainNames = [].concat(premium, available, formatDomains(domains));

        setOptions(domainNames.map((text) => ({ text, value: text })));

        if (!initDomain) {
            setDomain(domainNames[0]);
            onChange(fakeEvent(domainNames[0]));
        }
    };

    useEffect(() => {
        withLoading(queryDomains());
    }, [domains]);

    return (
        <Select
            className={className}
            disabled={loadingDomains || loadingPremiumDomains || loading || disabled}
            value={domain}
            options={options}
            onChange={handleChange}
        />
    );
};

DomainsSelect.propTypes = {
    disabled: PropTypes.bool,
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    domain: PropTypes.string,
    className: PropTypes.string
};

export default DomainsSelect;
