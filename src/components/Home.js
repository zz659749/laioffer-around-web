import React from 'react';
import { Tabs, Spin, Row, Col } from 'antd';
import { CreatePostButton } from './CreatePostButton';
import { Gallery } from './Gallery';
import {
  GEOLOCATION_OPTIONS,
  POSITION_KEY,
  TOKEN_KEY,
  API_ROOT,
  AUTH_HEADER,
  POST_TYPE_IMAGE,
  POST_TYPE_VIDEO,
} from '../constants';
import '../styles/Home.css';

const { TabPane } = Tabs;

export class Home extends React.Component {
  state = {
    loadingGeolocation: false,
    loadingPosts: false,
    errorMessage: null,
    posts: [],
  }

  getGeolocation() {
    this.setState({
      loadingGeolocation: true,
      errorMessage: null,
    });
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        this.onGeolocationSuccess,
        this.onGeolocationFailure,
        GEOLOCATION_OPTIONS,
      );
    } else {
      this.setState({
        loadingGeolocation: false,
        errorMessage: 'Your browser does not support geolocation.',
      });
    }
  }

  onGeolocationSuccess = (position) => {
    this.setState({
      loadingGeolocation: false,
      errorMessage: null,
    })
    console.log(position);
    const { latitude, longitude } = position.coords;
    localStorage.setItem(POSITION_KEY, JSON.stringify({ latitude, longitude }));
    this.loadNearbyPost();
  }

  onGeolocationFailure = () => {
    this.setState({
      loadingGeolocation: false,
      errorMessage: 'Failed to load geolocation.',
    })
  }

  loadNearbyPost = (
    position = JSON.parse(localStorage.getItem(POSITION_KEY)),
    range = 20,
  ) => {
    this.setState({
      loadingPosts: true,
      errorMessage: null,
    });
    const token = localStorage.getItem(TOKEN_KEY);
    fetch(`${API_ROOT}/search?lat=${position.latitude}&lon=${position.longitude}&range=${range}`, {
      method: 'GET',
      headers: {
        Authorization: `${AUTH_HEADER} ${token}`,
      },
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to load posts.');
    }).then((data) => {
      console.log(data);
      this.setState({
        loadingPosts: false,
        posts: data ? data : [],
      });
    }).catch((error) => {
      this.setState({
        loadingPosts: false,
        errorMessage: error.message,
      });
    });
  }

  getPosts(type) {
    if (this.state.errorMessage) {
      return <div>{this.state.errorMessage}</div>
    } else if(this.state.loadingGeolocation) {
      return <Spin tip="Loading geolocation..."/>
    } else if (this.state.loadingPosts) {
      return <Spin tip="Loading posts..." />
    } else if (this.state.posts.length > 0) {
      if (type === POST_TYPE_IMAGE) {
        return this.getImagePosts();
      } else if (type === POST_TYPE_VIDEO) {
        return this.getVideoPosts();
      }
    } else {
      return 'No nearby posts.';
    }
  }

  getImagePosts() {
    const images = this.state.posts
      .filter((post) => post.type === POST_TYPE_IMAGE)
      .map((post) => {
        return {
          user: post.user,
          src: post.url,
          thumbnail: post.url,
          caption: post.message,
          thumbnailWidth: 400,
          thumbnailHeight: 300,
        }
      });

    return (<Gallery images={images}/>);
  }

  getVideoPosts() {
    return (
      <Row gutter={30}>
        {
          this.state.posts
            .filter((post) => post.type === POST_TYPE_VIDEO)
            .map((post) => (
              <Col span={6} key={post.url}>
                <video src={post.url} controls={true} className="video-block" />
                <div>{`${post.user}: ${post.message}`}</div>
              </Col>
            ))
        }
      </Row>
    );
  }

  componentDidMount() {
    this.getGeolocation();
  }

  render() {
    const operations = <CreatePostButton onSuccess={this.loadNearbyPost} />;
    return (
      <Tabs tabBarExtraContent={operations} className="main-tabs">
        <TabPane tab="Image Posts" key="1">
          {this.getPosts(POST_TYPE_IMAGE)}
        </TabPane>
        <TabPane tab="Video Posts" key="2">
          {this.getPosts(POST_TYPE_VIDEO)}
        </TabPane>
        <TabPane tab="Tab 3" key="3">
          Content of tab 3
        </TabPane>
      </Tabs>
    );
  }
};
