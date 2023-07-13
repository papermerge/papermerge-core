import Placeholder from 'react-bootstrap/Placeholder';
import Form from 'react-bootstrap/Form';

import useAutocompleteTags from 'hooks/autocomplete-tags';
import ColoredTagInput from 'components/tag-input/colored-tag-input';
import type { ColoredTagType } from 'types';


type Args = {
  endpoint_url: string;
  headers: HeadersInit;
  initial_tags: ColoredTagType[];
  onChange: (tags: ColoredTagType[]) => void;
}


function RainbowTags({
  initial_tags,
  onChange,
  headers,
  endpoint_url
}: Args) {
  /*
  Colored Tag Input component which loads autocomplete tags from remote REST API endpoint.

  initial_tags: list of tags already present in tag list
  endpoint_url: endpoint where to load autocomplete tags from
  headers: HTTP headers used for authentication of the endpoint_url
  */
  const {is_loading, error, data} = useAutocompleteTags(endpoint_url, headers);

  if (is_loading) {
    return (
      <div className='d-flex justify-content-center'>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only"></span>
        </div>
      </div>
     );
  }

  if (error) {
    return <div>Error {error}</div>
  }

  return (
    <div>
      <Form.Label htmlFor="tags">Tags</Form.Label>
      <ColoredTagInput
        initial_tags={initial_tags}
        autocomplete_tags={data}
        onChange={onChange} />
    </div>
  );
}


export default RainbowTags;
