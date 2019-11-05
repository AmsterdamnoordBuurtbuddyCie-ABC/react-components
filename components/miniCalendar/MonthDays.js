import { isAfter, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { classnames } from '../../helpers/component';

const MonthDays = ({
    days,
    onSelectDate,
    markers = {},
    onSelectDateRange,
    dateRange,
    formatDay,
    now,
    selectedDate,
    activeDate,
    numberOfDays,
    numberOfWeeks
}) => {
    const [temporaryDateRange, setTemporaryDateRange] = useState();
    const rangeStartRef = useRef();
    const rangeEndRef = useRef();

    const style = {
        '--minicalendar-days-numberOfDays': numberOfDays,
        '--minicalendar-days-numberOfWeeks': numberOfWeeks
    };

    const getDate = (el) => {
        return days[el.dataset.i];
    };

    const handleMouseDown = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }

        if (rangeStartRef.current) {
            return;
        }

        const targetDate = getDate(target);

        setTemporaryDateRange([targetDate, undefined]);
        rangeStartRef.current = targetDate;

        const handleMouseUp = () => {
            if (rangeEndRef.current && rangeStartRef.current) {
                onSelectDateRange(
                    isAfter(rangeEndRef.current, rangeStartRef.current)
                        ? [rangeStartRef.current, rangeEndRef.current]
                        : [rangeEndRef.current, rangeStartRef.current]
                );
            }

            setTemporaryDateRange();
            rangeStartRef.current = undefined;
            rangeEndRef.current = undefined;

            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseOver = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }

        if (!rangeStartRef.current) {
            return;
        }

        const overDate = getDate(target);
        rangeEndRef.current = overDate;

        setTemporaryDateRange(
            isAfter(overDate, rangeStartRef.current)
                ? [rangeStartRef.current, overDate]
                : [overDate, rangeStartRef.current]
        );
    };

    const handleClick = ({ target }) => {
        if (typeof target.dataset.i === 'undefined') {
            return;
        }
        onSelectDate(getDate(target));
    };

    const [rangeStart, rangeEnd] = temporaryDateRange || dateRange || [];

    return (
        <div
            className="aligncenter minicalendar-days"
            style={style}
            onClick={handleClick}
            onMouseDown={onSelectDateRange ? handleMouseDown : null}
            onMouseOver={onSelectDateRange ? handleMouseOver : null}
        >
            {days.map((dayDate, i) => {
                const isActiveMonth = isSameMonth(dayDate, activeDate);
                const isCurrent = isSameDay(now, dayDate);
                const isInterval =
                    rangeStart && rangeEnd && isWithinInterval(dayDate, { start: rangeStart, end: rangeEnd });
                const isIntervalBound = isSameDay(rangeStart, dayDate) || isSameDay(rangeEnd, dayDate);
                const isPressed = isSameDay(selectedDate, dayDate) || isInterval;

                const hasMarker = markers[dayDate.getTime()];

                const className = classnames([
                    'minicalendar-day',
                    !isActiveMonth && 'minicalendar-day--inactive-month',
                    isIntervalBound && 'minicalendar-day--range-bound',
                    isInterval && 'minicalendar-day--range'
                ]);

                return (
                    <button
                        aria-label={formatDay(dayDate)}
                        aria-current={isCurrent ? 'date' : false}
                        aria-pressed={isPressed}
                        key={dayDate.toString()}
                        className={className}
                        data-i={i}
                    >
                        {dayDate.getDate()}
                        {hasMarker ? <span className="minicalendar-day--marker" /> : null}
                    </button>
                );
            })}
        </div>
    );
};

MonthDays.propTypes = {
    markers: PropTypes.object,
    days: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    formatDay: PropTypes.func.isRequired,
    onSelectDate: PropTypes.func.isRequired,
    onSelectDateRange: PropTypes.func,
    numberOfDays: PropTypes.number.isRequired,
    numberOfWeeks: PropTypes.number.isRequired,
    now: PropTypes.instanceOf(Date),
    selectedDate: PropTypes.instanceOf(Date),
    activeDate: PropTypes.instanceOf(Date)
};

export default React.memo(MonthDays);
