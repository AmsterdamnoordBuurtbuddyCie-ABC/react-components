import React, { Ref } from 'react';
import { c } from 'ttag';
import { Icon, DropdownCaret, classnames } from '../../';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    content?: string;
    className?: string;
    isOpen?: boolean;
    buttonRef?: Ref<HTMLButtonElement>;
}

const SupportDropdownButton = ({ content = c('Header').t`Support`, className, isOpen, buttonRef, ...rest }: Props) => {
    return (
        <button
            type="button"
            className={classnames(['support-dropdown-button', className])}
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
        >
            <Icon name="support1" className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert" />
            <span className="navigation-title topnav-linkText mr0-5">{content}</span>
            <DropdownCaret isOpen={isOpen} className="expand-caret topnav-icon mtauto mbauto" />
        </button>
    );
};

export default SupportDropdownButton;
