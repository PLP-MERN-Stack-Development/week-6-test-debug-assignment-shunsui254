// PostCard.test.jsx - Unit tests for PostCard component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PostCard from '../../components/PostCard';

// Wrapper component for router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Mock post data
const mockPost = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Post Title',
  excerpt: 'This is a test post excerpt for testing purposes',
  author: {
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
  },
  category: {
    name: 'Technology',
    color: '#3b82f6',
  },
  createdAt: '2023-01-15T10:30:00Z',
  views: 125,
  likeCount: 15,
  commentCount: 8,
  featuredImage: 'https://example.com/featured.jpg',
  isLiked: false,
};

const mockCurrentUser = {
  _id: '507f1f77bcf86cd799439022',
  username: 'currentuser',
  email: 'current@example.com',
};

describe('PostCard Component', () => {
  const defaultProps = {
    post: mockPost,
    currentUser: mockCurrentUser,
    onLike: jest.fn(),
    onComment: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders post card with all basic information', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check if main elements are rendered
    expect(screen.getByTestId('post-card')).toBeInTheDocument();
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText(mockPost.excerpt)).toBeInTheDocument();
    expect(screen.getByText(mockPost.category.name)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('125 views')).toBeInTheDocument();
  });

  it('renders featured image when provided', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    const featuredImage = screen.getByRole('img', { name: mockPost.title });
    expect(featuredImage).toBeInTheDocument();
    expect(featuredImage).toHaveAttribute('src', mockPost.featuredImage);
  });

  it('does not render featured image when not provided', () => {
    const postWithoutImage = { ...mockPost, featuredImage: null };
    
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithoutImage} />
      </RouterWrapper>
    );

    const featuredImage = screen.queryByRole('img', { name: mockPost.title });
    expect(featuredImage).not.toBeInTheDocument();
  });

  it('renders author avatar when provided', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    const authorAvatar = screen.getByRole('img', { name: mockPost.author.username });
    expect(authorAvatar).toBeInTheDocument();
    expect(authorAvatar).toHaveAttribute('src', mockPost.author.avatar);
  });

  it('falls back to username when first and last name are not provided', () => {
    const postWithUsernameOnly = {
      ...mockPost,
      author: {
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithUsernameOnly} />
      </RouterWrapper>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders category with correct background color', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    const categoryElement = screen.getByText(mockPost.category.name);
    expect(categoryElement).toHaveStyle(`background-color: ${mockPost.category.color}`);
  });

  it('does not render category when not provided', () => {
    const postWithoutCategory = { ...mockPost, category: null };
    
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithoutCategory} />
      </RouterWrapper>
    );

    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check if date is formatted as expected (Jan 15, 2023)
    expect(screen.getByText('Jan 15, 2023')).toBeInTheDocument();
  });

  it('displays like and comment counts correctly', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('❤️ 15')).toBeInTheDocument();
    expect(screen.getByText('💬 8')).toBeInTheDocument();
  });

  it('displays zero counts when like/comment counts are zero', () => {
    const postWithZeroCounts = {
      ...mockPost,
      likeCount: 0,
      commentCount: 0,
    };

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithZeroCounts} />
      </RouterWrapper>
    );

    expect(screen.getByText('❤️ 0')).toBeInTheDocument();
    expect(screen.getByText('💬 0')).toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', () => {
    const mockOnLike = jest.fn();

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} onLike={mockOnLike} />
      </RouterWrapper>
    );

    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);

    expect(mockOnLike).toHaveBeenCalledTimes(1);
    expect(mockOnLike).toHaveBeenCalledWith(mockPost._id);
  });

  it('calls onComment when comment button is clicked', () => {
    const mockOnComment = jest.fn();

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} onComment={mockOnComment} />
      </RouterWrapper>
    );

    const commentButton = screen.getByTestId('comment-button');
    fireEvent.click(commentButton);

    expect(mockOnComment).toHaveBeenCalledTimes(1);
    expect(mockOnComment).toHaveBeenCalledWith(mockPost._id);
  });

  it('disables like button when currentUser is not provided', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} currentUser={null} />
      </RouterWrapper>
    );

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toBeDisabled();
  });

  it('does not call onLike when button is disabled', () => {
    const mockOnLike = jest.fn();

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} currentUser={null} onLike={mockOnLike} />
      </RouterWrapper>
    );

    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);

    expect(mockOnLike).not.toHaveBeenCalled();
  });

  it('shows liked state when post is liked', () => {
    const likedPost = { ...mockPost, isLiked: true };

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={likedPost} />
      </RouterWrapper>
    );

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toHaveClass('post-card__like-btn--liked');
  });

  it('hides actions when showActions is false', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} showActions={false} />
      </RouterWrapper>
    );

    expect(screen.queryByTestId('like-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('comment-button')).not.toBeInTheDocument();
  });

  it('shows actions by default', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByTestId('like-button')).toBeInTheDocument();
    expect(screen.getByTestId('comment-button')).toBeInTheDocument();
  });

  it('creates correct link to post detail page', () => {
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} />
      </RouterWrapper>
    );

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toHaveAttribute('href', `/posts/${mockPost._id}`);
  });

  it('handles missing excerpt gracefully', () => {
    const postWithoutExcerpt = { ...mockPost, excerpt: null };

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithoutExcerpt} />
      </RouterWrapper>
    );

    // Should not crash and should not display excerpt section
    expect(screen.queryByText('This is a test post excerpt')).not.toBeInTheDocument();
  });

  it('handles missing view count gracefully', () => {
    const postWithoutViews = { ...mockPost, views: undefined };

    render(
      <RouterWrapper>
        <PostCard {...defaultProps} post={postWithoutViews} />
      </RouterWrapper>
    );

    // Should display 'undefined views' or handle gracefully
    const viewsText = screen.getByText(/views/);
    expect(viewsText).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-post-card';
    
    render(
      <RouterWrapper>
        <PostCard {...defaultProps} className={customClass} />
      </RouterWrapper>
    );

    const postCard = screen.getByTestId('post-card');
    expect(postCard).toHaveClass(customClass);
  });
});
