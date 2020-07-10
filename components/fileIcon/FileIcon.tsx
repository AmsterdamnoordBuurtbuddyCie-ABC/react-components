import React from 'react';
import { isSupportedImage, isSupportedText, isVideo } from '../../containers/filePreview/helpers';
import { classnames } from '../../helpers/component';
import Icon from '../icon/Icon';

const iconsMap: { [mimeType: string]: { name: string } } = {
    Folder: { name: 'folder' },
    'application/msword': { name: 'file-doc' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        name: 'file-docx'
    },
    'application/pdf': { name: 'file-pdf' },
    'application/vnd.ms-powerpoint': { name: 'file-ppt' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        name: 'file-pptx'
    },
    'application/x-rar-compressed': { name: 'file-rar-zip' },
    'application/zip': { name: 'file-rar-zip' },
    'application/vnd.ms-excel': { name: 'file-xls' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        name: 'file-xslx'
    },
    'application/xliff+xml': { name: 'file-xliff' },
    'application/xml': { name: 'file-xml' }
};

const getIconName = (mimeType: string) => {
    let name = 'file-unknown';

    if (isSupportedImage(mimeType)) {
        name = 'file-image';
    } else if (isSupportedText(mimeType)) {
        name = 'file-txt';
    } else if (isVideo(mimeType)) {
        name = 'file-video';
    } else if (iconsMap[mimeType]) {
        name = iconsMap[mimeType].name;
    }

    return name;
};

interface Props {
    mimeType: string;
}

const FileIcon = ({ mimeType, ...rest }: Props) => {
    const name = getIconName(mimeType);
    const colorClass = iconsMap[mimeType]?.colorClass;

    return <Icon name={name} className={classnames(['flex-item-noshrink mr0-5', colorClass])} {...rest} />;
};

export default FileIcon;
