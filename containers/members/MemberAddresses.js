import React from 'react';
import PropTypes from 'prop-types';
import { msgid, c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { SimpleDropdown, DropdownMenu } from 'react-components';
import { AppLink } from '../../index';

const MemberAddresses = ({ member, addresses }) => {
    const list = addresses.map(({ ID, Email }) => (
        <div key={ID} className="w100 flex flex-nowrap pl1 pr1 pt0-5 pb0-5">
            <span className="ellipsis" title={Email}>
                {Email}
            </span>
        </div>
    ));
    const n = list.length;
    const addressesTxt = ` ${c('Info').ngettext(msgid`address`, `addresses`, n)}`;
    const contentDropDown = (
        <>
            {n}
            <span className="nomobile">{addressesTxt}</span>
        </>
    ); // trick for responsive and mobile display

    return (
        <>
            <SimpleDropdown className="pm-button--link" content={contentDropDown}>
                <div className="dropDown-item pt0-5 pb0-5 pl1 pr1 flex">
                    <AppLink
                        className="pm-button w100 aligncenter"
                        to={`/addresses/${member.ID}`}
                        toApp={APPS.PROTONMAIL_SETTINGS}
                    >{c('Link').t`Manage`}</AppLink>
                </div>
                <DropdownMenu>{list}</DropdownMenu>
            </SimpleDropdown>
        </>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired,
    addresses: PropTypes.array.isRequired,
};

export default MemberAddresses;
