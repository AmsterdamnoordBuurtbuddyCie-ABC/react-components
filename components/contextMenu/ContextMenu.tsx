import React, { useState, useEffect } from 'react';

import { generateUID, Dropdown } from '../..';
import { CORNERS_ONLY_PLACEMENTS } from '../popper/utils';

interface Props {
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    children: React.ReactNode;
    position?: {
        top: number;
        left: number;
    };
    close: () => void;
    autoClose?: boolean;
}

const ContextMenu = ({ anchorRef, children, isOpen, position, close, autoClose = true }: Props) => {
    const [uid] = useState(generateUID('context-menu'));

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleContextMenu = () => {
            if (autoClose) {
                close();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isOpen, autoClose, close]);

    return (
        <Dropdown
            id={uid}
            isOpen={isOpen}
            originalPosition={position}
            availablePlacements={CORNERS_ONLY_PLACEMENTS}
            noCaret
            autoCloseOutsideAnchor={false}
            originalPlacement="bottom-left"
            offset={1}
            anchorRef={anchorRef}
            onClose={close}
            onContextMenu={(e) => e.stopPropagation()}
        >
            {children}
        </Dropdown>
    );
};

export default ContextMenu;
