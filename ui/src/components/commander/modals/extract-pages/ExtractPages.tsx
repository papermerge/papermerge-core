import { useState } from "react";
import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import type { FolderType, ExtractedPagesType, ExtractStrategy } from 'types';
import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import ExtractPagesOptions from "./ExtractOptions";


type ApiArgs = {
  source_page_ids: string[];
  target_folder: FolderType;
  signal: AbortSignal
}


async function api_extract_pages({
  source_page_ids,
  target_folder,
  signal
}: ApiArgs): Promise<Response> {
  return fetch(
    '/api/nodes/extract',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_page_ids,
        target_folder_id: target_folder.id
      }),
      'signal': signal
    },
  );
}


type ModalArgs = {
  onCancel: () => void;
  onOK: (arg: ExtractedPagesType) => void;
  source_page_ids: string[];
  target_folder: FolderType;
}


const ExtractPagesModal = ({
  onCancel,
  onOK,
  source_page_ids,
  target_folder
}: ModalArgs) => {
  const [title_format, setTitleFormat] = useState<string>('');
  const [strategy, setStrategy] = useState<ExtractStrategy>('single-doc');

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_extract_pages({
      source_page_ids,
      target_folder,
      signal
    });

    await response.json();

    if (response.status == 200) {
      //...
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  return (
    <GenericModal
      modal_title='Extract Page(s)'
      submit_button_title='Extract'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        Do you want to extract selected pages to
        folder <span className='text-primary'>{target_folder.title}</span>?

        <ExtractPagesOptions />
    </GenericModal>
  );
}

type ExtractPagesArgs = {
  source_page_ids: Array<string>;
  target_folder: FolderType;
}


function extract_pages({source_page_ids, target_folder}: ExtractPagesArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<ExtractedPagesType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <ExtractPagesModal
          source_page_ids={source_page_ids}
          target_folder={target_folder}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default extract_pages;
