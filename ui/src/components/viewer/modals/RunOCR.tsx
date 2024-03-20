import { useState } from 'react';

import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import OCRLang from './OCRLang';
import type { DocumentType, DocumentVersion, OCRCode } from 'types';


type ApiRunOCRArgs = {
  doc: DocumentType;
  lang: string;
  signal: AbortSignal;
}


async function api_run_ocr({
  doc,
  lang,
  signal
}: ApiRunOCRArgs): Promise<Response> {
  return fetch(
    '/api/tasks/ocr',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        id: doc.id,
        lang,
      }),
      'signal': signal
    },
  ).then(res => {
    if (res.status == 401) {
      throw Error(`${res.status} ${res.statusText}`)
    }
    return res
  });
}


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (task_id: string) => void;
  doc: DocumentType;
  doc_ver: DocumentVersion;
}


const RunOCRModal = ({
  onCancel,
  onOK,
  doc,
  doc_ver
}: Args) => {

  const [lang, setLang] = useState<OCRCode>(doc_ver.lang);
  const [langs, setLangs] = useState<string[]>();

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_run_ocr({
        doc,
        lang,
        signal
      });

      let {task_id} = await response.json();

      if (response.status == 200) {
        onOK(task_id);
      }
    } catch(error: any) {
      onCancel(error)
    }
  }

  const onLangChange = (value: OCRCode) => {
    setLang(value);
    console.log(`New lang value ${value}`);
  }

  return (
    <GenericModal
      modal_title="Run OCR"
      submit_button_title="Start"
      onSubmit={handleSubmit}
      onCancel={onCancel}>
        <OCRLang defaultValue={doc_ver.lang} onChange={onLangChange} />
    </GenericModal>
  );
}


function run_ocr(doc: DocumentType, doc_ver: DocumentVersion) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <RunOCRModal
          doc={doc}
          doc_ver={doc_ver}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default run_ocr;
