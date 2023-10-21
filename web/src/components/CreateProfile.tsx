import { gql, useMutation } from '@apollo/client';
import { ME_QUERY } from '../pages/Profile';
import { useState } from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import Modal from 'react-modal'
import { customStyles } from '../styles/CustomModalStyles';


const CREATE_PROFILE_MUTATION = gql`
  mutation createProfile(
    $bio: String
    $location: String
    $website: String
    $avatar: String
  ) {
    createProfile(
      bio: $bio
      location: $location
      website: $website
      avatar: $avatar
    ) {
      id
    }
  }
`

interface ProfileValues {
  bio: string
  location: string
  website: string
  avatar: string
}

const CreateProfile = () => {
  const [createProfile] = useMutation(CREATE_PROFILE_MUTATION , {
    refetchQueries: [{ query: ME_QUERY }]
  })

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const initialValues: ProfileValues = {
    bio: '',
    location: '',
    website: '',
    avatar: ''
  }

  const openModal = () => setModalIsOpen(true)
  const closeModal = () => setModalIsOpen(false)


  return (
    <div>
      <button onClick={openModal} className="edit-button">
        Create Profile
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Modal"
        style={customStyles}
        ariaHideApp={false}
      >
        <Formik
          initialValues={initialValues}
          // validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setSubmitting(true)
            await createProfile({
              variables: values,
            })

            setSubmitting(false)
            setModalIsOpen(false)
          }}
        >
          <Form>
            <Field name="bio" type="text" as="textarea" placeholder="Bio" />
            <ErrorMessage name="bio" component={"div"} />
            <Field name="location" type="location" placeholder="Location" />
            <ErrorMessage name="location" component={"div"} />
            <Field name="website" type="website" placeholder="Website" />
            <ErrorMessage name="website" component={"div"} />

            <button type="submit" className="login-button">
              <span>Create Profile</span>
            </button>
          </Form>
        </Formik>
      </Modal>
    </div>
  )
}
export default CreateProfile