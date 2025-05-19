export const useEventTypes = () => {
    const eventTypes = {
        CONCERT: {
            label: 'Concert',
            color: 'primary'
        },
        REHEARSAL: {
            label: 'Rehearsal',
            color: 'yellow'
        },
        BIRTHDAY: {
            label: 'Birthday',
            color: 'pink'
        },
        CELEBRATION: {
            label: 'Celebration',
            color: 'purple'
        },
        VACATION: {
            label: 'Vacation',
            color: 'green'
        },
        SOCIAL: {
            label: 'Social',
            color: 'blue'
        },
        MISC: {
            label: 'Miscellaneous',
            color: 'gray'
        }
    } as const;

    return {
        eventTypes
    };
};
