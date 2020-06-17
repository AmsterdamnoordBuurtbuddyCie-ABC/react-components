import React from 'react';
import { c } from 'ttag';

import { OrderableHandle, Icon, DropdownActions, useModals } from 'react-components';
import { clearType, getType } from 'proton-shared/lib/contacts/property';
import { ContactProperty, ContactPropertyChange } from 'proton-shared/lib/interfaces/contacts';

import ContactFieldProperty from './ContactFieldProperty';
import ContactModalLabel from './ContactModalLabel';
import ContactImageModal from '../../containers/contacts/modals/ContactImageModal';

interface Props {
    property: ContactProperty;
    onChange: (payload: ContactPropertyChange) => void;
    onRemove: (value: string) => void;
    isOrderable?: boolean;
}

const ContactModalRow = ({ property, onChange, onRemove, isOrderable = false }: Props) => {
    const { createModal } = useModals();
    const { field, uid, value } = property;
    const type = clearType(getType(property.type));
    const canDelete = !['fn'].includes(field);
    const canClear = ['photo', 'logo'].includes(field) && property.value;
    const canEdit = ['photo', 'logo'].includes(field) && !!value;

    const handleChangeImage = () => {
        const handleSubmit = (value: string) => onChange({ uid, value });
        createModal(<ContactImageModal url={property.value as string} onSubmit={handleSubmit} />);
    };

    const list = [];

    if (canEdit) {
        list.push({
            text: c('Action').t`Edit`,
            onClick: handleChangeImage
        });
    }
    if (canClear) {
        list.push({
            text: c('Action').t`Clear`,
            onClick: () => {
                onChange({ uid, value: '' });
            }
        });
    }
    if (canDelete) {
        list.push({
            text: <Icon name="trash" className="color-global-warning mauto" alt={c('Action').t`Delete`} />,
            onClick: () => {
                if (property.uid) {
                    onRemove(property.uid);
                }
            }
        });
    }

    return (
        <div className="flex flex-nowrap flex-item-noshrink">
            {isOrderable ? (
                <OrderableHandle key="icon">
                    <div className="cursor-row-resize mr0-5 flex flex-item-noshrink mb1">
                        <Icon name="text-justify" className="mtauto mbauto" />
                    </div>
                </OrderableHandle>
            ) : (
                <div className="mr0-5 flex flex-items-center flex-item-noshrink">
                    <Icon name="text-justify nonvisible" />
                </div>
            )}
            <div className="flex flex-nowrap flex-items-center onmobile-flex-column w95">
                <span className="w30 contact-modal-select flex flex-nowrap flex-items-center mb1 onmobile-mb0-5 onmobile-flex-self-start">
                    <ContactModalLabel field={field} type={type} uid={property.uid} onChange={onChange} />
                </span>
                <div className="flex flex-nowrap flex-items-center flex-item-noshrink">
                    <span className="flex-item-fluid mb1">
                        <div className="pr1 w100 onmobile-pr0-5">
                            <ContactFieldProperty
                                field={field}
                                value={property.value}
                                uid={property.uid}
                                onChange={onChange}
                            />
                        </div>
                    </span>
                    <span className="mb1">
                        <div className="min-w3e">
                            {list.length > 0 && (
                                <div className="flex flex-item-noshrink flex-items-start">
                                    <DropdownActions className="pm-button--for-icon" list={list} />
                                </div>
                            )}
                        </div>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ContactModalRow;
