import { useState } from "react";
import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import { drop_extension } from 'utils/string';
import type { FolderType, ExtractedPagesType, ExtractStrategy } from 'types';
import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import ExtractPagesOptions from "./ExtractOptions";


type ApiArgs = {
  source_page_ids: string[];
  target_folder: FolderType;
  strategy: ExtractStrategy;
  title_format: string;
  signal: AbortSignal;
}


async function api_extract_pages({
  source_page_ids,
  target_folder,
  strategy,
  title_format,
  signal
}: ApiArgs): Promise<Response> {
  return fetch(
    '/api/nodes/extract',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_page_ids,
        target_folder_id: target_folder.id,
        strategy,
        title_format
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
  document_title: string;
}


const ExtractPagesModal = ({
  onCancel,
  onOK,
  source_page_ids,
  target_folder,
  document_title
}: ModalArgs) => {
  const [title_format, setTitleFormat] = useState<string>(
    drop_extension(document_title)
  );
  const [strategy, setStrategy] = useState<ExtractStrategy>('all-pages-in-one-doc');

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_extract_pages({
      source_page_ids,
      target_folder,
      strategy,
      title_format,
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

  const onStrategyChange = (value: ExtractStrategy) => {
    setStrategy(value);
  };

  const onTitleFormatChange =  (value: string) => {
    setTitleFormat(value);
  };

  return (
    <GenericModal
      modal_title='Extract Page(s)'
      submit_button_title='Extract'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        Do you want to extract selected pages to
        folder <span className='text-primary'>{target_folder.title}</span>?

        <ExtractPagesOptions
          strategy={strategy}
          title_format={title_format}
          onStrategyChange={onStrategyChange}
          onTitleFormatChange={onTitleFormatChange} />
    </GenericModal>
  );
}

type ExtractPagesArgs = {
  source_page_ids: Array<string>;
  target_folder: FolderType;
  document_title: string;
}


function extract_pages({source_page_ids, target_folder, document_title}: ExtractPagesArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<ExtractedPagesType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <ExtractPagesModal
          source_page_ids={source_page_ids}
          target_folder={target_folder}
          document_title={document_title}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default extract_pages;
