import React, { useEffect, useState } from 'react';
import { createRoot } from "react-dom/client";

import GenericModal from 'components/modals/Generic';
import { fetcher } from 'utils/fetcher';
import { MODALS } from 'cconstants';


type Args = {
  onCancel: () => void;
  onOK: (arg: unknown) => void;
}

type Version = {
  version: string;
}

type AboutArgs = {
  version?: string;
}

const About = ({version}: AboutArgs) => {
  return (
    <div className='container'>
    <div className='row'>
      <div className='col-3'>
          <img src='images/papermerge512-centered.png'/>
      </div>
      <div className="col-9">
        <h4>Papermerge DMS {version}</h4>
        <p>
          Open source document management system for digital archives
        </p>
        <p>
          For tickets, announcements and discussions use <a href="https://github.com/ciur/papermerge">ciur/papermerge</a> meta repository.
          The most important repository, where source code of the core/rest api/ui resides is <a href="https://github.com/papermerge/papermerge-core">this one</a>.
        </p>
        <ul className="list-unstyled">
          <li>License: <a href="https://github.com/papermerge/papermerge-core/blob/master/LICENSE">Apache 2.0</a></li>
          <li>Documentation: <a href="https://docs.papermerge.io">https://docs.papermerge.io</a></li>
          <li>Website: <a href="https://papermerge.com">https://papermerge.com</a></li>
          <li>GitHub Org: <a href="https://github.com/papermerge">https://github.com/papermerge</a></li>
          <li>YT Channel: <a href="https://www.youtube.com/@papermerge">@papermerge</a></li>
        </ul>
      </div>
    </div>
  </div>
  )
}


const AboutModal = ({onCancel, onOK}: Args) => {
  const [version, setVersion] = useState<string>();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetcher('/api/version/').then((data: Version) => {
      setVersion(data.version)
    });
  }, [])


  return (
    <GenericModal
      modal_title='About'
      submit_button_title='OK'
      onSubmit={() => {}}
      onCancel={() => {}}>
        <About version={version} />
    </GenericModal>
  );
}


function about(): Promise<unknown> {
  /* Opens rename modal dialog

  Returns a promise with NodeType.
  NodeType will be fulfilled when server returns.
  Fulfilled NodeType has new nodes titles (or whatever server returns).
  */
  let modals = document.getElementById(MODALS);

  let promise = new Promise(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <AboutModal
          onOK={onOK}  // handler for resolve
          onCancel={onCancel} // handler for reject
        />
      );
    }
  }); // END of new Promise...

  return promise;
}

export default about;
