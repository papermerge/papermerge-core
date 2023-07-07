import Placeholder from 'react-bootstrap/Placeholder';

import useAutocompleteTags from 'hooks/autocomplete-tags';
import ColoredTagInput from 'components/tags/colored-tag-input';
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
      <p className="placeholder-glow">
        <span className="placeholder col-12 placeholder-lg"></span>
      </p>
     );
  }

  if (error) {
    return <div>Error {error}</div>
  }

  return (
    <ColoredTagInput
      initial_tags={initial_tags}
      autocomplete_tags={data}
      onChange={onChange} />
  );
}


export default RainbowTags;
