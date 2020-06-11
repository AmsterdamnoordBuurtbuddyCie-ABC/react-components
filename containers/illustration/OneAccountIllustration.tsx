import React from 'react';
import { c } from 'ttag';

import { Icon } from 'react-components';

const OneAccountIllustration = () => {
    return (
        <div className="center flex flex-column flex-items-center">
            <div className="inline-flex">
                <span className="bg-global-altgrey icon-28p rounded50 flex">
                    <Icon name="protondrive" className="color-global-light mauto" alt="ProtonDrive"></Icon>
                </span>
                <span className="w40p"></span>
                <span className="bg-global-altgrey icon-20p rounded50 flex mt2">
                    <Icon name="protoncontacts" className="color-global-light mauto" size="12"></Icon>
                </span>
            </div>

            <span className="bg-global-altgrey icon-42p rounded50 inline-flex mt0-25 mb0-5">
                <Icon name="protonmail" className="color-global-light mauto" size="24"></Icon>
            </span>

            <div className="inline-flex">
                <span className="bg-global-altgrey icon-28p rounded50 flex mt0-5">
                    <Icon name="protonvpn" className="color-global-light mauto" size="20"></Icon>
                </span>
                <span className="w40p mr0-5r"></span>
                <span className="bg-global-altgrey icon-24p rounded50 flex ">
                    <Icon name="protoncalendar" className="color-global-light mauto"></Icon>
                </span>
            </div>

            <div className="mw60 mt1 aligncenter">{c('Info').t`One account for all Proton services`}</div>
        </div>
    );
};

export default OneAccountIllustration;
