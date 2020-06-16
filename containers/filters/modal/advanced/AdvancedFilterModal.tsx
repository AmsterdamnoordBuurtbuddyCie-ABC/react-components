import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { c } from 'ttag';
import {
    FormModal,
    useLoading,
    useApi,
    useFilters,
    useActiveBreakpoint,
    useMailSettings,
    useDebounceInput,
    useNotifications,
    useEventManager,
    useApiWithoutResult
} from 'react-components';
import { FILTER_VERSION } from 'proton-shared/lib/filters/constants';
import { Filter, StepSieve, AdvancedSimpleFilterModalModel, ErrorsSieve } from 'proton-shared/lib/filters/interfaces';
import { normalize } from 'proton-shared/lib/helpers/string';
import { checkSieveFilter, addTreeFilter, updateFilter } from 'proton-shared/lib/api/filters';
import { convertModel } from 'proton-shared/lib/filters/utils';
import { templates as sieveTemplates } from 'proton-shared/lib/filters//sieve';

import FilterNameForm from '../FilterNameForm';
import HeaderAdvancedFilterModal from './HeaderAdvancedFilterModal';
import FooterAdvancedFilterModal from './FooterAdvancedFilterModal';
import SieveForm from './SieveForm';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props {
    filter: Filter;
    onClose: () => void;
}

const AdvancedFilterModal = ({ filter, onClose = noop, ...rest }: Props) => {
    const api = useApi();
    const { isNarrow } = useActiveBreakpoint();
    const [loading, withLoading] = useLoading();
    const [filters = []] = useFilters();
    const [mailSettings] = useMailSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const isEdit = !!filter?.ID;
    const title = isEdit ? c('Title').t`Edit sieve filter` : c('Title').t`Add sieve filter`;

    const sieveTemplate = sieveTemplates[filter?.Version || FILTER_VERSION];

    const [model, setModel] = useState<AdvancedSimpleFilterModalModel>({
        id: filter?.ID,
        step: StepSieve.NAME,
        sieve: filter?.Sieve || sieveTemplate || '',
        name: filter?.Name || '',
        issues: []
    });
    const sieve = useDebounceInput(model.sieve);

    const errors = useMemo<ErrorsSieve>(() => {
        return {
            name: !model.name
                ? c('Error').t`This field is required`
                : !isEdit && filters.find(({ Name }: Filter) => normalize(Name) === normalize(model.name))
                ? c('Error').t`Filter with this name already exist`
                : '',
            sieve: model.sieve
                ? model.issues.length
                    ? c('Error').t`Invalid sieve code`
                    : ''
                : c('Error').t`This field is required`
        };
    }, [model.name, model.sieve, model.issues]);

    const reqCreate = useApiWithoutResult(addTreeFilter);
    const reqUpdate = useApiWithoutResult(updateFilter);

    const createFilter = async (filter: Filter) => {
        try {
            const { Filter } = await reqCreate.request(filter);
            createNotification({
                text: c('Notification').t`${Filter.Name} created`
            });
        } finally {
            // Some failed request will add the filter but in disabled mode
            // So we have to refresh the list in both cases
            call();
            onClose();
        }
    };

    const editFilter = async (filter: Filter) => {
        const { Filter } = await reqUpdate.request(filter.ID, filter);
        call();
        createNotification({
            text: c('Filter notification').t`Filter ${Filter.Name} updated`
        });
        onClose();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isEdit) {
            await editFilter(convertModel(model, true));
            return;
        }

        await createFilter(convertModel(model, true));
    };

    const checkSieve = async () => {
        const { Issues = [] } = await api(checkSieveFilter({ Version: FILTER_VERSION, Sieve: sieve }));
        setModel({
            ...model,
            issues: Issues.length ? Issues : []
        });
    };

    useEffect(() => {
        if (sieve) {
            withLoading(checkSieve());
        } else {
            setModel({ ...model, issues: [] });
        }
    }, [sieve]);

    return (
        <FormModal
            title={title}
            loading={loading}
            onClose={onClose}
            onSubmit={(event: FormEvent<HTMLFormElement>) => withLoading(handleSubmit(event))}
            footer={
                <FooterAdvancedFilterModal
                    model={model}
                    errors={errors}
                    onChange={setModel}
                    onClose={onClose}
                    loading={loading}
                />
            }
            {...rest}
        >
            <HeaderAdvancedFilterModal model={model} errors={errors} onChange={setModel} />
            {model.step === StepSieve.NAME ? (
                <FilterNameForm
                    model={model}
                    onChange={(newModel) => setModel(newModel as AdvancedSimpleFilterModalModel)}
                    isNarrow={isNarrow}
                    errors={errors}
                />
            ) : null}
            {model.step === StepSieve.SIEVE ? (
                <SieveForm model={model} onChange={setModel} errors={errors} mailSettings={mailSettings} />
            ) : null}
        </FormModal>
    );
};

export default AdvancedFilterModal;