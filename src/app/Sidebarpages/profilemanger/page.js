"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Profile.module.css';
import { 
  savePatientProfile, 
  updatePatientProfile, 
  getAllPatientProfiles, 
  deletePatientProfile 
} from './patientService';

const Profile = () => {
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Form states with extra patient details
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    role: '',
    avatar: '',
    weight: '',
    height: '',
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    contact: '',
    address: ''
  });

  const familyRoles = [
    'Father', 'Mother', 'Son', 'Daughter',
    'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Other'
  ];

  const defaultAvatars = {
    'Father': '👨‍⚕️',
    'Mother': '👩‍⚕️', 
    'Son': '👦',
    'Daughter': '👧',
    'Grandfather': '👴',
    'Grandmother': '👵',
    'Uncle': '👨',
    'Aunt': '👩',
    'Other': '👤'
  };

  // Load profiles from Firestore on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const firebaseProfiles = await getAllPatientProfiles();
      
      // If no profiles in Firebase, create sample profile
      if (firebaseProfiles.length === 0) {
        const sampleProfile = {
          name: 'Revanth',
          age: 18,
          gender: 'Male',
          role: 'Son',
          weight: '70',
          height: '175',
          bloodGroup: 'B+',
          allergies: 'None',
          medicalConditions: 'None',
          contact: '9876543210',
          address: 'Chennai',
          avatar: '👨‍⚕️'
        };
        
        const profileId = await savePatientProfile(sampleProfile);
        setProfiles([{ id: profileId, ...sampleProfile }]);
      } else {
        setProfiles(firebaseProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.age || !formData.gender || !formData.role || !formData.bloodGroup || !formData.contact) {
      setError('Please fill in all required fields');
      return;
    }

    const profileData = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      role: formData.role,
      avatar: formData.avatar || defaultAvatars[formData.role] || '👤',
      weight: formData.weight,
      height: formData.height,
      bloodGroup: formData.bloodGroup,
      allergies: formData.allergies || 'None',
      medicalConditions: formData.medicalConditions || 'None',
      contact: formData.contact,
      address: formData.address
    };

    try {
      setLoading(true);

      if (editingProfile) {
        // Update existing profile
        await updatePatientProfile(editingProfile.id, profileData);
        setProfiles(profiles.map(profile =>
          profile.id === editingProfile.id ? { id: editingProfile.id, ...profileData } : profile
        ));
      } else {
        // Create new profile
        const profileId = await savePatientProfile(profileData);
        setProfiles([...profiles, { id: profileId, ...profileData }]);
      }

      setShowModal(false);
      setEditingProfile(null);
      resetFormData();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile? All data will be lost.')) {
      try {
        setLoading(true);
        await deletePatientProfile(profileId);
        setProfiles(profiles.filter(profile => profile.id !== profileId));
      } catch (error) {
        console.error('Error deleting profile:', error);
        setError('Failed to delete profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      age: profile.age.toString(),
      gender: profile.gender,
      role: profile.role,
      avatar: profile.avatar,
      weight: profile.weight || '',
      height: profile.height || '',
      bloodGroup: profile.bloodGroup,
      allergies: profile.allergies || '',
      medicalConditions: profile.medicalConditions || '',
      contact: profile.contact,
      address: profile.address || ''
    });
    setShowModal(true);
  };

  // Store only the profile id for easy access throughout the app
  const handleSelectProfile = (profile) => {
    localStorage.setItem('selectedProfileId', profile.id);
    router.push('/GS');
  };

  const resetFormData = () => {
    setFormData({
      name: '', age: '', gender: '', role: '', avatar: '',
      weight: '', height: '', bloodGroup: '', allergies: '',
      medicalConditions: '', contact: '', address: ''
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProfile(null);
    setError('');
    resetFormData();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Who's seeking health support today?</h1>
        <p className={styles.subtitle}>Choose your profile to continue with personalized care</p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          Loading...
        </div>
      )}

      <div className={styles.profilesWrapper}>
        <div className={styles.profilesGrid}>
          {profiles.map((profile) => (
            <div key={profile.id} className={styles.profileCard}>
              <div className={styles.profileImageContainer}>
                <div
                  className={styles.profileImage}
                  onClick={() => handleSelectProfile(profile)}
                >
                  <span className={styles.avatar}>{profile.avatar}</span>
                </div>
                <div className={styles.profileActions}>
                  <button
                    className={styles.editBtn}
                    onClick={(e) => { e.stopPropagation(); handleEditProfile(profile); }}
                    title="Edit Profile"
                    disabled={loading}
                  >✏️</button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                    title="Delete Profile"
                    disabled={loading}
                  >🗑️</button>
                </div>
              </div>
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{profile.name}</h3>
                <p className={styles.profileDetails}>{profile.role} • Age {profile.age}</p>
              </div>
            </div>
          ))}

          {/* Add Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileImageContainer}>
              <div
                className={`${styles.profileImage} ${styles.addProfileImage}`}
                onClick={() => setShowModal(true)}
              >
                <span className={styles.addIcon}>+</span>
              </div>
            </div>
            <div className={styles.profileInfo}>
              <h3 className={styles.profileName}>Add Profile</h3>
              <p className={styles.profileDetails}>Create new family member</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProfile ? 'Edit Profile' : 'Add New Patient'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            {error && (
              <div className={styles.modalError}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfile} className={styles.form}>
              {/* Name */}
              <div className={styles.inputGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              {/* Age + Gender */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Age *</label>
                  <input
                    type="number" min="0" max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    required
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Role */}
              <div className={styles.inputGroup}>
                <label>Family Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Select</option>
                  {familyRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Weight + Height */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Weight (kg)</label>
                  <input
                    type="number" min="1" max="300"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Height (cm)</label>
                  <input
                    type="number" min="30" max="250"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className={styles.inputGroup}>
                <label>Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Allergies */}
              <div className={styles.inputGroup}>
                <label>Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  placeholder="e.g. Penicillin, Dust"
                  disabled={loading}
                />
              </div>

              {/* Medical Conditions */}
              <div className={styles.inputGroup}>
                <label>Medical Conditions</label>
                <input
                  type="text"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                  placeholder="e.g. Diabetes"
                  disabled={loading}
                />
              </div>

              {/* Contact */}
              <div className={styles.inputGroup}>
                <label>Contact Number *</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              {/* Address */}
              <div className={styles.inputGroup}>
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={loading}
                />
              </div>

              {/* Avatar */}
              <div className={styles.inputGroup}>
                <label>Avatar (Optional)</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  placeholder="Enter emoji or leave blank"
                  disabled={loading}
                />
              </div>

              <div className={styles.buttonGroup}>
                <button type="button" onClick={closeModal} className={styles.cancelBtn} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Saving...' : (editingProfile ? 'Update Profile' : 'Create Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;