import React, { useState } from 'react';
import ColoredTag from 'components/tag-input/colored-tag';
import type { ColoredTagType } from 'types';


type Args = {
  initial_tags: ColoredTagType[];
  autocomplete_tags: ColoredTagType[];
  onChange: (tags: ColoredTagType[]) => void;
}


function ColoredTagInput({
  initial_tags,
  autocomplete_tags,
  onChange
}: Args) {
  const [current_tags, setCurrentTags] = useState<ColoredTagType[]>(initial_tags);
  const [value, setValue] = useState('');

  let colored_tags;
  let autocomplete_tag_options;
  const uniq_datalist_id = Math.random().toString(36);


  const new_tag = (tag_name: string, autocomplete_tags: ColoredTagType[]): ColoredTagType => {
    /*
      Creates a complete ColoredTag object from a given tag_name
    */
    let found_tag: ColoredTagType | undefined;

    found_tag = autocomplete_tags.find(value => value.name === tag_name)

    if (found_tag) {
      return found_tag;
    }

    return {
      name: tag_name,
      fg_color: 'white',
      bg_color: 'green'
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    const currentValue = value.trim();

    if (key === 'Tab' && currentValue !== '') {
      if (current_tags.find(v => v.name === currentValue)) {
        // such tag already exists in the list i.e. duplicate
        event.preventDefault();
        setValue('');
        return;
      }
      let new_tag_list = [
        ...current_tags, new_tag(currentValue, autocomplete_tags)
      ];

      event.preventDefault();
      setCurrentTags(new_tag_list);
      setValue('');
      onChange(new_tag_list);
    }
  }

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value)
  }

  const onRemoveHandler = (name: string) => {
    const new_tag_list = current_tags.filter((i: ColoredTagType) => i.name !== name);
    setCurrentTags(new_tag_list);
    onChange(new_tag_list);
  }

  colored_tags = current_tags.map((item) => {
    return <ColoredTag key={item.name} value={item} onRemove={onRemoveHandler}/>;
  });


  autocomplete_tag_options = autocomplete_tags.map((item) => {
    return <option key={item.name} value={item.name} />;
  })

  return (
    <div>
      {colored_tags}
      <input
        type="text"
        list={uniq_datalist_id}
        placeholder="enter new tag"
        onKeyDown={onKeyDown}
        onChange={onInputChange}
        value={value} />
      <datalist id={uniq_datalist_id}>
        {autocomplete_tag_options}
      </datalist>
    </div>
  );
}


export default ColoredTagInput;
