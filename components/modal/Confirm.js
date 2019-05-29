import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal } from 'react-components';

const Confirm = ({ title, onClose, onConfirm, children, cancel, confirm, ...rest }) => {
    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => {
                onConfirm();
                onClose();
            }}
            title={title}
            close={cancel}
            autoFocusClose={true}
            submit={confirm}
            small
            {...rest}
        >
            {children}
        </FormModal>
    );
};

Confirm.propTypes = {
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    loading: PropTypes.bool
};

Confirm.defaultProps = {
    cancel: c('Action').t`Cancel`,
    confirm: c('Action').t`Confirm`,
    title: c('Action').t`Confirm`
};

export default Confirm;
