import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import Icon from '../icon/Icon';
import NavMenu from './NavMenu';

const NavItem = ({ type, link, text, onClick, icon, list, color, className }) => {
    const content = (
        <>
            {icon && <Icon fill="light" name={icon} color={color} className="mr1" />}
            {text}
        </>
    );

    if (type === 'link') {
        return (
            <li className="navigation__item">
                <NavLink className={`navigation__link ellipsis ${className}`} to={link}>
                    {content}
                </NavLink>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    if (type === 'text') {
        return (
            <li className="navigation__item">
                <span className={`navigation__link ellipsis ${className}`}>
                    {content}
                    {list.length ? <NavMenu list={list} /> : null}
                </span>
            </li>
        );
    }

    if (type === 'button') {
        return (
            <li className="navigation__item">
                <button type="button" className={`w100 navigation__link ellipsis ${className}`} onClick={onClick}>
                    {content}
                </button>
                {list.length ? <NavMenu list={list} /> : null}
            </li>
        );
    }

    return null;
};

NavItem.propTypes = {
    icon: PropTypes.string,
    color: PropTypes.string,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['link', 'button', 'text']),
    link: PropTypes.string,
    text: PropTypes.string,
    list: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string
};

NavItem.defaultProps = {
    type: 'link',
    className: '',
    list: []
};

export default NavItem;
