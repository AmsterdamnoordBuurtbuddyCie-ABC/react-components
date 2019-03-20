import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from './index';
import useDebounceInput from './useDebounceInput';

/**
 * <Search delay={500} onChange={handleChange} value={keywords} />
 * @param {Number} delay used to debounce search value (default: 0)
 * @param {Function} onChange returns directly the value and not the event
 * @param {String} value initial
 * @returns {React.Component}
 */
const Search = ({ delay, onChange, value, ...rest }) => {
    const [keywords, setKeywords] = useState(value);
    const words = useDebounceInput(keywords, delay);
    const handleChange = ({ target }) => setKeywords(target.value);

    useEffect(() => {
        onChange(words);
    }, [words]);

    return <Input value={keywords} onChange={handleChange} type="search" {...rest} />;
};

Search.propTypes = {
    delay: PropTypes.number,
    onChange: PropTypes.func,
    value: PropTypes.string
};

Search.defaultProps = {
    delay: 0
};

export default Search;
