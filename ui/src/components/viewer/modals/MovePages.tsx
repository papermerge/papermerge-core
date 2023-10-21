import { useState } from 'react';

import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import MoveOptions from './MoveOptions';
import type { MoveStrategyType, InsertAtType } from './types';


type ApiMovePagesArgs = {
  source_page_ids: Array<string>;
  target_page_id: string;
  move_strategy: MoveStrategyType;
  insert_at: InsertAtType;
  signal: AbortSignal;
}


async function api_move_pages({
  source_page_ids,
  target_page_id,
  move_strategy,
  insert_at,
  signal,
}: ApiMovePagesArgs): Promise<Response> {
  return fetch(
    '/api/pages/move',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_page_ids,
        target_page_id,
        move_strategy,
        insert_at
      }),
      'signal': signal
    },
  );
}


type Args = {
  onCancel: () => void;
  onOK: (arg: string) => void;
  source_page_ids: Array<string>;
  target_page_id: string;
  target_doc_title: string;
}


const MovePagesModal = ({
  onCancel,
  onOK,
  source_page_ids,
  target_page_id,
  target_doc_title
}: Args) => {

  const [move_strategy, setMoveStrategy] = useState<MoveStrategyType>('append');
  const [insert_at, setInsertAt] = useState<InsertAtType>('beginning');

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_move_pages({
      source_page_ids,
      target_page_id,
      move_strategy,
      insert_at,
      signal
    });

    await response.json();

    if (response.status == 200) {
      onOK("some thing here");
    }
  }

  const onStrategyChange = (value: MoveStrategyType) => {
    setMoveStrategy(value);
    console.log(`New strategy value ${value}`);
  }

  const onInsertAtChange = (value: InsertAtType) => {
    setInsertAt(value);
    console.log(`New insert at value ${value}`);
  }

  return (
    <GenericModal
      modal_title="Move Selected Pages"
      submit_button_title="Move Pages"
      onSubmit={handleSubmit}
      onCancel={onCancel}>
        Do you want to move selected pages to document '{target_doc_title}'?
        <MoveOptions
          move_strategy={move_strategy}
          onStrategyChange={onStrategyChange}
          onInsertAtChange={onInsertAtChange} />
    </GenericModal>
  );
}

type MovePageArgs = {
  source_page_ids: Array<string>;
  target_page_id: string;
  target_doc_title: string;
}

function move_pages({
  source_page_ids,
  target_page_id,
  target_doc_title
}: MovePageArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <MovePagesModal
          source_page_ids={source_page_ids}
          target_page_id={target_page_id}
          target_doc_title={target_doc_title}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default move_pages;
