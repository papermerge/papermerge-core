import { useState } from 'react';

import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import OCRLang from './OCRLang';
import type { DocumentVersion } from 'types';


type ApiRunOCRArgs = {
  doc_ver: DocumentVersion;
  lang: string;
  signal: AbortSignal;
}


async function api_run_ocr({
  doc_ver,
  lang,
  signal,
}: ApiRunOCRArgs): Promise<Response> {
  return fetch(
    '/api/tasks/ocr',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        id: doc_ver.id,
        lang,
      }),
      'signal': signal
    },
  );
}


type Args = {
  onCancel: () => void;
  onOK: (task_id: string) => void;
  doc_ver: DocumentVersion;
}


const RunOCRModal = ({
  onCancel,
  onOK,
  doc_ver
}: Args) => {

  const [lang, setLang] = useState<string>(doc_ver.lang);
  const [langs, setLangs] = useState<string[]>();

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_run_ocr({
      doc_ver,
      lang,
      signal
    });

    let {task_id} = await response.json();

    if (response.status == 200) {
      onOK(task_id);
    }
  }

  const onLangChange = (value: string) => {
    setLang(value);
    console.log(`New lang value ${value}`);
  }


  return (
    <GenericModal
      modal_title="Run OCR"
      submit_button_title="Start"
      onSubmit={handleSubmit}
      onCancel={onCancel}>
        <OCRLang onChange={onLangChange} />
    </GenericModal>
  );
}


function run_ocr(doc_ver: DocumentVersion) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <RunOCRModal
          doc_ver={doc_ver}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default run_ocr;
