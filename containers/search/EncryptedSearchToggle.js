import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle } from 'react-components';

const EncryptedSearchToggle = ({ id }) => {
    const { state, toggle } = useToggle(); // TODO set default
    const handleChange = () => {
        // TODO
        toggle();
    };
    return <Toggle id={id} checked={state} onChange={handleChange} />;
};

EncryptedSearchToggle.propTypes = {
    id: PropTypes.string
};

export default EncryptedSearchToggle;
