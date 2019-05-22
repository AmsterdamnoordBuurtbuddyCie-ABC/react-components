import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import Button from './Button';
import Icon from '../icon/Icon';

const Copy = ({ value }) => {
    const [copied, setCopied] = useState(false);

    const handleClick = () => {
        textToClipboard(value);

        if (!copied) {
            setCopied(true);
        }
    };

    return (
        <Button
            onClick={handleClick}
            className={`${copied ? 'copied' : ''} pm-button--for-icon`}
            title={copied ? c('Label').t`Copied` : c('Label').t`Copy`}
        >
            <Icon name="clipboard" />
        </Button>
    );
};

Copy.propTypes = {
    value: PropTypes.string.isRequired,
    className: PropTypes.string
};

Copy.defaultProps = {
    className: ''
};

export default Copy;
