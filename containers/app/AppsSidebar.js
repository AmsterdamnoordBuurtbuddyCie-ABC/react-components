import React from 'react';
import PropTypes from 'prop-types';
import { Icon, useConfig, Tooltip, Link, ToggleMenu } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

const { PROTONMAIL, PROTONCONTACTS, PROTONMAIL_SETTINGS, PROTONCALENDAR } = APPS;

const AppsSidebar = ({ items = [], isCollapsedMenu, setCollapseMenu }) => {
    const { APP_NAME } = useConfig();
    const apps = [
        { appNames: [PROTONMAIL, PROTONMAIL_SETTINGS], icon: 'protonmail', title: 'ProtonMail', link: '/inbox' },
        { appNames: [PROTONCONTACTS], icon: 'protoncontacts', title: 'ProtonContacts', link: '/contacts' },
        {
            appNames: [PROTONCALENDAR],
            icon: 'protoncalendar',
            title: 'ProtonCalendar',
            link: '/calendar'
        }
    ].filter(Boolean);

    return (
        <aside
            className="aside flex-column flex-nowrap noprint nomobile is-hidden-when-sidebar-is-collapsed"
            id="aside-bar"
        >
            <div className="flex mb2 nomobile">
                <ToggleMenu isCollapsedMenu={isCollapsedMenu} onToggleMenu={setCollapseMenu} />
            </div>

            <ul className="unstyled m0 aligncenter flex flex-column flex-item-fluid aside-listIcons">
                {apps.map(({ appNames = [], icon, title, link }, index) => {
                    const isCurrent = appNames.includes(APP_NAME);
                    const key = `${index}`;
                    return (
                        <li key={key} className="mb0-5">
                            <Tooltip title={title} originalPlacement="right">
                                <Link
                                    to={link}
                                    className="center flex aside-link"
                                    external={!isCurrent}
                                    aria-current={isCurrent}
                                >
                                    <Icon name={icon} className="aside-linkIcon mauto" />
                                </Link>
                            </Tooltip>
                        </li>
                    );
                })}
                <li className="flex-item-fluid" />
                {items.map((item, index) => (
                    <li key={`${index}`} className="mb0-5">
                        {item}
                    </li>
                ))}
            </ul>
        </aside>
    );
};

AppsSidebar.propTypes = {
    items: PropTypes.arrayOf(PropTypes.node),
    isCollapsedMenu: PropTypes.bool.isRequired,
    setCollapseMenu: PropTypes.func.isRequired
};

export default AppsSidebar;
