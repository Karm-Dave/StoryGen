import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';

function ImageDropzone({ onImageUpload }) {
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      setError('Some files were rejected. Only JPEG, PNG and GIF images are allowed.');
      return;
    }

    if (acceptedFiles.length > 5) {
      setError('You can only upload up to 5 images at a time.');
      return;
    }

    // Create preview URLs
    const urls = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Call the parent component's upload handler
    onImageUpload(acceptedFiles);
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 4 * 1024 * 1024, // 4MB
    maxFiles: 5
  });

  return (
    <div className="image-dropzone">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here ...</p>
        ) : (
          <p>Drag and drop images here, or click to select files</p>
        )}
        <p className="hint">(Up to 5 images, max 4MB each)</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="preview-container">
          {previewUrls.map((url, index) => (
            <div key={index} className="preview-item">
              <img src={url} alt={`Preview ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ImageDropzone.propTypes = {
  onImageUpload: PropTypes.func.isRequired
};

export default ImageDropzone;