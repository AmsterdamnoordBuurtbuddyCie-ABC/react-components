import React from 'react';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import LinkItem from './LinkItem';
import { SubSectionConfigWithPermissions } from '../../components/layout';

interface Props {
    link: string;
    text: string;
    subsections?: SubSectionConfigWithPermissions[];
    permissions?: PERMISSIONS[];
    pagePermissions?: PERMISSIONS[];
}
const Sections = ({ link, subsections = [], text, permissions = [], pagePermissions = [] }: Props) => {
    return (
        <ul className="unstyled mt0-5">
            {subsections.length ? (
                subsections
                    .filter(({ hide }) => !hide)
                    .map(({ text, id, permissions: sectionPermissions }) => {
                        return (
                            <li key={id}>
                                <LinkItem
                                    to={`${link}#${id}`}
                                    text={text}
                                    permission={hasPermission(permissions, pagePermissions, sectionPermissions)}
                                />
                            </li>
                        );
                    })
            ) : (
                <li>
                    <LinkItem to={link} text={text} permission={hasPermission(permissions, pagePermissions)} />
                </li>
            )}
        </ul>
    );
};

export default Sections;
