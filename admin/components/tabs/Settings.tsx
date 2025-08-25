import React, { useEffect, useState } from 'react';
import { Heading } from '@/components/ui/heading'
import { BootstrapSwitch } from '@/components/ui/bootstrap-switch';
import api from '@/lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // or your custom Card component
import RichTextEditor from '../ui/rich-text-editor';
import ColorPicker from '../ui/color-picker'
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
    javaFooterBackgroundColor: ''
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
      }
      setIsSaved(true)

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

  let handleSaveSettings = async (e: any) => {
    e.preventDefault();
    console.log(formData)

    try {
      let response = await api.post('/api/setting/update', {...formData, isAddCode: enableAddCode, isPostJob: enablePostJob, isApplyJob: enableApplyJob, isJobs: enableJobs})
      if (response.status === 200) {
        setIsSaved(true)
      }
    } catch (error) {
      console.log(error)
    }
  }



  return (
    <div>

      <Heading level={2} > Settings</Heading>

      <div className='admin-settings-container mt-3 p-3'>


        <div className='mb-3'>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">

            
            <Card>
              <CardHeader>
                <CardTitle>JAVA</CardTitle>
              </CardHeader>
              <CardContent>

                <label htmlFor='javaHeading' className='mb-2 block'>Heading</label>
                <input type='text' value={formData.javaHeading} id='javaHeading' className='w-[400px] p-2' name='javaHeading' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />


                <br />

                <RichTextEditor value={formData.javaCode} onChange={(newContent: any, _editor: any) => {
                  setFormData(prev => {
                    return {
                      ...prev,
                      javaCode: newContent
                    }
                  })
                }} />
                <br />
                <br />

                <label htmlFor='javaFooterBackgroundColor' className='mb-2 block'>Footer Background Color</label>
                <ColorPicker value={formData.javaFooterBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      javaFooterBackgroundColor: e.target.value
                    }
                  })
                }
                } />
                <br />
                <label htmlFor='javaBackgroundColor' className='mb-2 block'>Background Color</label>
                <ColorPicker value={formData.javaBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      javaBackgroundColor: e.target.value
                    }
                  })
                }
                } />


                <label htmlFor='javaFontSize' className='mb-2 block'>Font Size</label>
                <input type='text' value={formData.javaFontSize} id='javaFontSize' className='w-[400px] p-2' name='javaFontSize' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />


              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PYTHON</CardTitle>
              </CardHeader>
              <CardContent>

                <label htmlFor='pythonHeading' className='mb-2 block'>Heading</label>
                <input type='text' value={formData.pythonHeading} id='pythonHeading' className='w-[400px] p-2' name='pythonHeading' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />

                <br />

                <RichTextEditor value={formData.pythonCode} onChange={(newContent: any, _editor: any) => {
                  setFormData(prev => {
                    return {
                      ...prev,
                      pythonCode: newContent
                    }
                  })
                }} />
                <br />
                <br />

                <label htmlFor='pythonFooterBackgroundColor' className='mb-2 block'>Footer Color</label>
                <ColorPicker value={formData.pythonFooterBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      pythonFooterBackgroundColor: e.target.value
                    }
                  })
                }
                } />
                <br />

                <label htmlFor='pythonBackgroundColor' className='mb-2 block'>Background Color</label>
                <ColorPicker value={formData.pythonBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      pythonBackgroundColor: e.target.value
                    }
                  })
                }
                } />

                <label htmlFor='pythonFontSize' className='mb-2 block'>Font Size</label>
                <input type='text' value={formData.pythonFontSize} id='pythonFontSize' className='w-[400px] p-2' name='pythonFontSize' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />



              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>HTML</CardTitle>
              </CardHeader>
              <CardContent>

                <label htmlFor='htmlHeading' className='mb-2 block'>Heading</label>
                <input type='text' value={formData.htmlHeading} id='htmlHeading' className='w-[400px] p-2' name='htmlHeading' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />


                <br />

                <RichTextEditor value={formData.htmlCode} onChange={(newContent: any, _editor: any) => {
                  setFormData(prev => {
                    return {
                      ...prev,
                      htmlCode: newContent
                    }
                  })
                }} />
                <br />
                <br />

                <label htmlFor='htmlFooterBackgroundColor' className='mb-2 block'>Footer Background Color</label>
                <ColorPicker value={formData.htmlFooterBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      htmlFooterBackgroundColor: e.target.value
                    }
                  })
                }
                } />
                <br />

                <label htmlFor='htmlBackgroundColor' className='mb-2 block'>Background Color</label>
                <ColorPicker value={formData.htmlBackgroundColor} onChange={(e: any) => {

                  setFormData(prev => {
                    return {
                      ...prev,
                      htmlBackgroundColor: e.target.value
                    }
                  })
                }
                } />

                <label htmlFor='htmlFontSize' className='mb-2 block'>Font Size</label>
                <input type='text' value={formData.htmlFontSize} id='htmlFontSize' className='w-[400px] p-2' name='htmlFontSize' onChange={handleInputChange} style={{ border: '1px solid rgb(218, 211, 211)', borderRadius: '5px' }} />



              </CardContent>
            </Card>

          </div>

          <Button className='block mt-2 pointer' style={{ cursor: 'pointer' }} onClick={handleSaveSettings}> Save </Button>


        </div>

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
      {
        isSaved && <p className='text-green-500 mb-2 text-center'>Settings Updated</p>
      }
    </div>
  );
}

export default Settings;
