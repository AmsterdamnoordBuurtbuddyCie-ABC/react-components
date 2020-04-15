import React, { ReactNode } from 'react';

import Icon from '../icon/Icon';

interface Props {
    icon?: string;
    iconColor?: string;
    text?: ReactNode;
    aside?: ReactNode;
}

const SidebarItemContent = ({ icon, iconColor, text, aside }: Props) => {
    return (
        <span className="flex flex-nowrap w100 flex-items-center">
            {icon && (
                <Icon
                    color={iconColor}
                    name={icon}
                    className="navigation__icon flex-item-noshrink mr0-5 flex-item-centered-vert"
                />
            )}
            {text ? <span className="flex-item-fluid ellipsis mw100">{text}</span> : null}
            {aside && <span className="flex flex-items-center">{aside}</span>}
        </span>
    );
};

export default SidebarItemContent;
