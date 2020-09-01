import React, { useState } from 'react';
import { generateUID, classnames } from '../../helpers';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from './useTooltipHandlers';

interface Props {
    children: React.ReactNode;
    title?: string;
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    scrollContainerClass?: string;
    className?: string;
    type?: 'error' | 'warning';
}

const Tooltip = ({
    children,
    title,
    originalPlacement = 'top',
    scrollContainerClass = 'main',
    className,
    type,
}: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const { isRTL } = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const { anchorRef, open, close, isOpen } = usePopperAnchor<HTMLSpanElement>();
    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef.current,
        isOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        scrollContainerClass,
    });
    const tooltipHandlers = useTooltipHandlers(open, close, isOpen);

    let tooltipClass = '';

    switch (type) {
        case 'error':
            tooltipClass = 'tooltip--warning';
            break;
        case 'warning':
            tooltipClass = 'tooltip--attention';
            break;
        default:
            break;
    }

    return (
        <>
            <span ref={anchorRef} {...tooltipHandlers} aria-describedby={uid} className={className}>
                {children}
            </span>
            <Popper
                divRef={setPopperEl}
                id={uid}
                isOpen={!!title && isOpen}
                style={position}
                className={classnames(['tooltip', `tooltip--${placement}`, ...tooltipClass])}
            >
                {title}
            </Popper>
        </>
    );
};

export default Tooltip;
