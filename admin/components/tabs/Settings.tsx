import React, { useEffect, useState } from 'react';
import { Heading } from '@/components/ui/heading'
import { BootstrapSwitch } from '@/components/ui/bootstrap-switch';
import api from '@/lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from '../ui/rich-text-editor';
import ColorPicker from '../ui/color-picker'
import TinyEditor from '../ui/TinyEditor';

const Settings = () => {
  const [enableAddCode, setEnableAddCode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [enablePostJob, setEnablePostJob] = useState(false);
  const [enableApplyJob, setEnableApplyJob] = useState(false);
  const [formData, setFormData] = useState({
    htmlHeading: '',
    htmlCode: '',
    pythonHeading: '',
    pythonCode: '',
    javaHeading: '',
    javaCode: '',
    htmlFontSize: '',
    pythonFontSize: '',
    javaFontSize: '',
    htmlBackgroundColor: '',
    javaBackgroundColor: '',
    pythonBackgroundColor: '',
    htmlFooterBackgroundColor: '',
    pythonFooterBackgroundColor: '',
    javaFooterBackgroundColor: '',
    // Add header colors
    htmlHeaderBackgroundColor: '',
    pythonHeaderBackgroundColor: '',
    javaHeaderBackgroundColor: ''
  });
  const [enableJobs, setEnableJobs] = useState(false);

  useEffect(() => {
    setIsSaved(false)
  }, [formData])

  useEffect(() => {
    api.get('/api/setting').then(response => {
      let data = response.data
      setEnableAddCode(data.isAddCode)
      setEnablePostJob(data.isPostJob)
      setEnableApplyJob(data.isApplyJob)
      setEnableJobs(data.isJobs)
      console.log('data', data)
      setFormData({ ...data })
    }).catch(err => {
      console.log('error to get setting', err)
    })
  }, [])

  // Handler functions for switches
  let handleAddCodeChange = async (checked: boolean) => {
    setIsSaved(false)
    setEnableAddCode(checked)
    try {
      let response = await api.post('/api/setting/update', { isAddCode: checked })
      if (response.status === 200) {
        setIsSaved(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  let handlePostJobChange = async (checked: boolean) => {
    setEnablePostJob(checked)
    setIsSaved(false)
    try {
      let response = await api.post('/api/setting/update', { isPostJob: checked })
      if (response.status === 200) {
        setIsSaved(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  let handleApplyJobChange = async (checked: boolean) => {
    setEnableApplyJob(checked)
    setIsSaved(false)
    try {
      let response = await api.post('/api/setting/update', { isApplyJob: checked })
      if (response.status === 200) {
        setIsSaved(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  let handleJobsChange = async (checked: boolean) => {
    setEnableJobs(checked)
    setIsSaved(false)
    try {
      let response = await api.post('/api/setting/update', { isJobs: checked })
      if (response.status === 200) {
        setIsSaved(true)
      }
    } catch (error) {
      setIsSaved(true)
    }
  }

  // Handler for regular input changes
  let handleInputChange = async (e: any) => {
    setIsSaved(false)
    let name = e.target.name
    let value = e.target.value

    setFormData(prev => {
      return {
        ...prev,
        [name]: value
      }
    })
  }

  // Handler for TinyEditor changes
  const handleTinyEditorChange = (field: string) => (content: string) => {
    setIsSaved(false);
    setFormData(prev => ({
      ...prev,
      [field]: content
    }));
  };

  // Handler for ColorPicker changes  
  const handleColorChange = (field: string) => (e: any) => {
    setIsSaved(false);
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  let handleSaveSettings = async (e: any) => {
    e.preventDefault();
    console.log('Saving form data:', formData)

    try {
      let response = await api.post('/api/setting/update', {
        ...formData, 
        isAddCode: enableAddCode, 
        isPostJob: enablePostJob, 
        isApplyJob: enableApplyJob, 
        isJobs: enableJobs
      })
      if (response.status === 200) {
        setIsSaved(true)
        console.log('Settings saved successfully')
      }
    } catch (error) {
      console.log('Error saving settings:', error)
    }
  }

  return (
    <div>
      <Heading level={2}>Settings</Heading>

      <div className='admin-settings-container mt-3 p-3'>
        <div className='mb-3'>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            
            {/* JAVA Card */}
            <Card>
              <CardHeader>
                <CardTitle>JAVA</CardTitle>
              </CardHeader>
              <CardContent>
                <label htmlFor='javaHeading' className='mb-2 block'>Heading</label>
                <input 
                  type='text' 
                  value={formData.javaHeading} 
                  id='javaHeading' 
                  className='w-full p-2 mb-4' 
                  name='javaHeading' 
                  onChange={handleInputChange} 
                  style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                />

                <div className="mb-4">
                  <label className='mb-2 block'>Code Content</label>
                  <TinyEditor
                    value={formData.javaCode}
                    onChange={handleTinyEditorChange('javaCode')}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor='javaHeaderBackgroundColor' className='mb-2 block'>Header Background Color</label>
                    <ColorPicker 
                      value={formData.javaHeaderBackgroundColor} 
                      onChange={handleColorChange('javaHeaderBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='javaBackgroundColor' className='mb-2 block'>Body Background Color</label>
                    <ColorPicker 
                      value={formData.javaBackgroundColor} 
                      onChange={handleColorChange('javaBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='javaFooterBackgroundColor' className='mb-2 block'>Footer Background Color</label>
                    <ColorPicker 
                      value={formData.javaFooterBackgroundColor} 
                      onChange={handleColorChange('javaFooterBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='javaFontSize' className='mb-2 block'>Font Size</label>
                    <input 
                      type='text' 
                      value={formData.javaFontSize} 
                      id='javaFontSize' 
                      className='w-full p-2' 
                      name='javaFontSize' 
                      onChange={handleInputChange} 
                      placeholder="e.g., 14px, 1rem, 16px"
                      style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PYTHON Card */}
            <Card>
              <CardHeader>
                <CardTitle>PYTHON</CardTitle>
              </CardHeader>
              <CardContent>
                <label htmlFor='pythonHeading' className='mb-2 block'>Heading</label>
                <input 
                  type='text' 
                  value={formData.pythonHeading} 
                  id='pythonHeading' 
                  className='w-full p-2 mb-4' 
                  name='pythonHeading' 
                  onChange={handleInputChange} 
                  style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                />

                <div className="mb-4">
                  <label className='mb-2 block'>Code Content</label>
                  <TinyEditor
                    value={formData.pythonCode}
                    onChange={handleTinyEditorChange('pythonCode')}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor='pythonHeaderBackgroundColor' className='mb-2 block'>Header Background Color</label>
                    <ColorPicker 
                      value={formData.pythonHeaderBackgroundColor} 
                      onChange={handleColorChange('pythonHeaderBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='pythonBackgroundColor' className='mb-2 block'>Body Background Color</label>
                    <ColorPicker 
                      value={formData.pythonBackgroundColor} 
                      onChange={handleColorChange('pythonBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='pythonFooterBackgroundColor' className='mb-2 block'>Footer Background Color</label>
                    <ColorPicker 
                      value={formData.pythonFooterBackgroundColor} 
                      onChange={handleColorChange('pythonFooterBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='pythonFontSize' className='mb-2 block'>Font Size</label>
                    <input 
                      type='text' 
                      value={formData.pythonFontSize} 
                      id='pythonFontSize' 
                      className='w-full p-2' 
                      name='pythonFontSize' 
                      onChange={handleInputChange} 
                      placeholder="e.g., 14px, 1rem, 16px"
                      style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HTML Card */}
            <Card>
              <CardHeader>
                <CardTitle>HTML</CardTitle>
              </CardHeader>
              <CardContent>
                <label htmlFor='htmlHeading' className='mb-2 block'>Heading</label>
                <input 
                  type='text' 
                  value={formData.htmlHeading} 
                  id='htmlHeading' 
                  className='w-full p-2 mb-4' 
                  name='htmlHeading' 
                  onChange={handleInputChange} 
                  style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                />

                <div className="mb-4">
                  <label className='mb-2 block'>Code Content</label>
                  <TinyEditor
                    value={formData.htmlCode}
                    onChange={handleTinyEditorChange('htmlCode')}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor='htmlHeaderBackgroundColor' className='mb-2 block'>Header Background Color</label>
                    <ColorPicker 
                      value={formData.htmlHeaderBackgroundColor} 
                      onChange={handleColorChange('htmlHeaderBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='htmlBackgroundColor' className='mb-2 block'>Body Background Color</label>
                    <ColorPicker 
                      value={formData.htmlBackgroundColor} 
                      onChange={handleColorChange('htmlBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='htmlFooterBackgroundColor' className='mb-2 block'>Footer Background Color</label>
                    <ColorPicker 
                      value={formData.htmlFooterBackgroundColor} 
                      onChange={handleColorChange('htmlFooterBackgroundColor')} 
                    />
                  </div>

                  <div>
                    <label htmlFor='htmlFontSize' className='mb-2 block'>Font Size</label>
                    <input 
                      type='text' 
                      value={formData.htmlFontSize} 
                      id='htmlFontSize' 
                      className='w-full p-2' 
                      name='htmlFontSize' 
                      onChange={handleInputChange} 
                      placeholder="e.g., 14px, 1rem, 16px"
                      style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button className='block mt-4 pointer' style={{ cursor: 'pointer' }} onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>

        <div className="space-y-2 mt-6">
          <BootstrapSwitch
            checked={enableAddCode}
            onChange={handleAddCodeChange}
            label="Enable Add Code"
          />
          <BootstrapSwitch
            checked={enablePostJob}
            onChange={handlePostJobChange}
            label="Enable Post Job"
          />
          <BootstrapSwitch
            checked={enableApplyJob}
            onChange={handleApplyJobChange}
            label="Enable Apply Job"
          />
          <BootstrapSwitch
            checked={enableJobs}
            onChange={handleJobsChange}
            label="Enable Jobs"
          />
        </div>
      </div>

      {isSaved && <p className='text-green-500 mb-2 text-center mt-4'>Settings Updated</p>}
    </div>
  );
}

export default Settings;