import React, { useRef, useState, useEffect, forwardRef, Ref } from 'react';

import { useHandler } from '../../hooks/useHandler';
import { SquireType, getSquireRef, setSquireRef, initSquire } from './squireConfig';
import { pasteFileHandler } from './squireActions';

const isHTMLEmpty = (html: string) => !html || html === '<div><br /></div>' || html === '<div><br></div>';

interface Props {
    placeholder?: string;
    onReady: () => void;
    onFocus: () => void;
    onInput: (value: string) => void;
    onAddImages: (files: File[]) => void;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 */
const SquireIframe = forwardRef(
    ({ placeholder, onReady, onFocus, onInput, onAddImages }: Props, ref: Ref<SquireType>) => {
        const [iframeReady, setIframeReady] = useState(false);
        const [squireReady, setSquireReady] = useState(false);
        const [isEmpty, setIsEmpty] = useState(false);

        const iframeRef = useRef<HTMLIFrameElement>(null);

        useEffect(() => {
            const handleLoad = () => setIframeReady(true);

            const iframeDoc =
                (iframeRef.current?.contentDocument || iframeRef.current?.contentWindow) &&
                iframeRef.current?.contentWindow?.document;

            if (iframeDoc && iframeDoc.readyState === 'complete') {
                handleLoad();
            }

            iframeRef.current?.addEventListener('load', handleLoad);
            return () => iframeRef.current?.removeEventListener('load', handleLoad);
        }, []);

        useEffect(() => {
            const init = async (iframeDoc: Document) => {
                const squire = await initSquire(iframeDoc);
                setSquireRef(ref, squire);
                setSquireReady(true);
                onReady();
            };

            if (iframeReady && !squireReady) {
                const iframeDoc = iframeRef.current?.contentWindow?.document as Document;
                init(iframeDoc);
            }
        }, [iframeReady]);

        const handleFocus = useHandler(() => {
            onFocus();
            // A bit artificial but will trigger "autoCloseOutside" from all dropdowns
            document.dispatchEvent(new CustomEvent('dropdownclose'));
        });
        const handleInput = useHandler(() => {
            const content = getSquireRef(ref).getHTML();
            setIsEmpty(isHTMLEmpty(content));
            onInput(content);
        });
        const handlePaste = useHandler(pasteFileHandler(onAddImages));

        useEffect(() => {
            if (squireReady) {
                const squire = getSquireRef(ref);

                squire.addEventListener('focus', handleFocus);
                squire.addEventListener('input', handleInput);
                squire.addEventListener('paste', handlePaste);
                return () => {
                    squire.removeEventListener('focus', handleFocus);
                    squire.removeEventListener('input', handleInput);
                    squire.removeEventListener('paste', handlePaste);
                };
            }
        }, [squireReady]);

        return (
            <div className="editor-squire-wrapper fill w100 scroll-if-needed flex-item-fluid rounded relative">
                {placeholder && isEmpty && (
                    <div className="absolute ml1 no-pointer-events placeholder">{placeholder}</div>
                )}
                <iframe ref={iframeRef} frameBorder="0" className="w100 h100 squireIframe"></iframe>
            </div>
        );
    }
);

export default SquireIframe;
