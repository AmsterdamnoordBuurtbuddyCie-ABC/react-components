import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

interface Props {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const BackButton = ({ onClick }: Props) => {
    return (
        <button type="button" onClick={onClick} title={c('Action').t`Back`}>
            <Icon name="arrow-left" />
            <span className="sr-only">{c('Action').t`Back`}</span>
        </button>
    );
};

export default BackButton;
