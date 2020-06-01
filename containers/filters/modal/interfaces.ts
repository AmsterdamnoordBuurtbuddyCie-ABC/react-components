export enum Step {
    NAME,
    CONDITIONS,
    ACTIONS,
    PREVIEW
}

export enum FilterStatement {
    ALL = 'all',
    ANY = 'any'
}

export enum ConditionType {
    SELECT = 'select',
    SUBJECT = 'subject',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    ATTACHMENTS = 'attachments'
}

export enum ConditionComparator {
    CONTAINS = 'contains',
    IS = 'is',
    STARTS = 'starts',
    ENDS = 'ends',
    MATCHES = 'matches',
    IS_NOT = '!is',
    DOES_NOT_CONTAIN = '!contains',
    DOES_NOT_START = '!starts',
    DOES_NOT_END = '!ends',
    DOES_NOT_MATCH = '!matches'
}

export interface Action {
    type: string;
}

export interface Condition {
    type: ConditionType;
    comparator: ConditionComparator;
    error?: string;
    values?: string[];
    withAttachment?: boolean;
    isOpen: boolean;
}

export interface FilterModalModel {
    step: Step;
    name: string;
    actions: Action[];
    conditions: Condition[];
}

export interface Filter {
    ID: string;
    Name: string;
    Status: number;
    Priority: number;
    Sieve: string;
    Version: number;
}

export interface Errors {
    name: string;
    actions: string;
    conditions: string;
}
