import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    DowngradeModal,
    LossLoyaltyModal,
    useApi,
    useUser,
    useNotifications,
    useLoading,
    useModals,
    useEventManager,
    useOrganization
} from 'react-components';
import { c } from 'ttag';
import { deleteSubscription } from 'proton-shared/lib/api/payments';

import { isLoyal } from 'proton-shared/lib/helpers/organization';

const UnsubscribeButton = ({ className, children }) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleUnsubscribe = async () => {
        await api(deleteSubscription());
        await call();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleClick = async () => {
        if (user.isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }

        await new Promise((resolve, reject) => {
            createModal(<DowngradeModal onConfirm={resolve} onClose={reject} />);
        });

        if (isLoyal(organization)) {
            await new Promise((resolve, reject) => {
                createModal(<LossLoyaltyModal user={user} onConfirm={resolve} onClose={reject} />);
            });
        }

        return handleUnsubscribe();
    };

    return (
        <Button loading={loading} className={className} onClick={() => withLoading(handleClick())}>
            {children}
        </Button>
    );
};

UnsubscribeButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

export default UnsubscribeButton;
