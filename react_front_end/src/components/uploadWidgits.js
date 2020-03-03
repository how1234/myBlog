import React, { useState, Fragment, useEffect } from "react";
import {
  Upload,
  Button,
  Icon,
  Col,
  Select,
  Divider,
  Input,
  Row,
  message
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { fileToText } from "../helper/fileReader";
import { fetchTags } from "../helper/CommonMethodsInClient";
import {
  uploadSingleBlogPost,
  getAllBlogPosts,
  getAllTags,
  createNewTag
} from "../helper/requestMethodsToServer";

const UploadWidgits = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { userId, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const tags = useSelector(state => state.tags.tagsList)
  const [newTagName, setNewTagName] = useState("");
  const [selectedTags, setSelectedTags] = useState("");

  useEffect(() => {
    let isCancelled = false;
    let runAsync = async () => {
      try {
        if (!isCancelled) {
          fetchTags(dispatch);
        }
      } catch (err) {
        if (!isCancelled) {
          throw err;
        }
      }
    };

    runAsync();

    return () => {
      runAsync = null
      isCancelled = true;
    };
  }, []);

  const handleInputChange = e => {
    e.preventDefault();
    setNewTagName(e.target.value);
  };

  const handleCreateTagEvent = async () => {
    if (!newTagName) {
      message.warn("The name of new tag can't be empty");
    } else {
      try {
        const result = await createNewTag(newTagName.trim(), { token, userId });
        console.log(result);
        if (result.errors) {
          message.warn(result.errors[0].message);
        } else {
          message.info("Successful");
        }
        
      } catch (err) {
        message.warn(err);
      }
    }
  };
  const handleUpload = async () => {
    if (selectedTags.length < 1) {
      message.warn("Tag can't be empty");
      return;
    }
    const sentFiles = [];

    try {
      for (let file of fileList) {
        let fileTextData = await fileToText(file);
        let title = file.name;
        sentFiles.push({ fileTextData, title });
      }

      setUploading(true);

      for (let i = 0; i < sentFiles.length; i++) {
        try {
          const result = await uploadSingleBlogPost(
            sentFiles[i],
            {
              token,
              userId
            },
            selectedTags
          );
          console.log(selectedTags);

          const serverData = await getAllBlogPosts();
          dispatch({
            type: "RELOAD_BLOGPOSTS",
            payload: serverData.data.blogPosts
          });
        } catch (error) {
          throw error;
        }
      }
      setUploading(false);
      setFileList([]);
    } catch (err) {
      throw err;
    }
  };

  const onRemove = file => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();

    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  const beforeUpload = file => {
    setFileList([file]);
    return false;
  };

  const uploadProps = {
    onRemove,
    beforeUpload,
    fileList
  };
  return (
    <Fragment>
      <Row type="flex" justify="center">
        <Col>
          <Upload {...uploadProps}>
            <Button className="upload_file_btn">
              <Icon type="upload" /> Upload
            </Button>
          </Upload>
        </Col>

        <Col>
          <Button
            className="trigger_upload_btn"
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
          >
            {uploading ? "Uploading" : "Start Upload"}
          </Button>
        </Col>

        {fileList && fileList.length > 0 && (
          <Col span={6}>
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Tags"
              mode="multiple"
              onSelect={label => {
                if (selectedTags.indexOf(label) < 0) {
                  setSelectedTags([...selectedTags, label]);
                }
              }}
              onDeselect={label => {
                setSelectedTags(
                  selectedTags.filter(element => element !== label)
                );
              }}
              dropdownRender={menu => (
                <div>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                </div>
              )}
            >
              {tags.map(item => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
            </Select>
          </Col>
        )}
      </Row>
      <Row style={{ marginTop: "5%" }} type="flex" justify="space-around">
        <Col>
          <Input
            onChange={handleInputChange}
            value={newTagName}
            placeholder="new Tag"
          />
        </Col>
        <Col>
          <Button onClick={handleCreateTagEvent}>Add new Tag</Button>
        </Col>
      </Row>
    </Fragment>
  );
};

export default UploadWidgits;
