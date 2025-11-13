import * as React from 'react'
import { useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Progress } from './ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

// ,jjljkolj

const { useStepper, steps, utils } = defineStepper(
  {
    id: 'LearPN',
    title: 'Check Réf Galia',
    description: 'Enter your LearPN details',
  },
  {
    id: 'complete',
    title: 'Check traceability Label',
    description: 'Checkout complete',
  }
)

function StepperDemo() {
  const stepper = useStepper()
  const [currentData, setCurrentData] = useState({
    part: {
      id: '',
      learPN: '',
      tescaPN: '',
      desc: '',
      qtyPerBox: '',
      createdAt: '',
      updatedAt: '',
    },
    materile: {
      id: '',
      material: '',
      materialDescription: '',
      storageUn: '',
      availStock: '',
      createdAt: '',
      updatedAt: '',
    },
  })

  const currentIndex = utils.getIndex(stepper.current.id)
  return (
    <div className='l m-4 p-4'>
      <div className='flex justify-between'>
        <h2 className='text-lg font-medium'>Checkout</h2>
        {/* <div className='overflow-x-auto rounded-xl bg-gray-900 p-4 text-green-400'>
          <pre>{JSON.stringify(currentData, null, 2)}</pre>
        </div> */}
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <div />
        </div>
      </div>
      <nav aria-label='Checkout Steps' className='group my-4'>
        <ol
          className='flex items-center justify-between gap-2'
          aria-orientation='horizontal'
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className='flex flex-shrink-0 items-center gap-4'>
                <Button
                  type='button'
                  role='tab'
                  variant={index <= currentIndex ? 'default' : 'secondary'}
                  aria-current={
                    stepper.current.id === step.id ? 'step' : undefined
                  }
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={stepper.current.id === step.id}
                  className='flex size-10 items-center justify-center rounded-full'
                  onClick={() => stepper.goTo(step.id)}
                >
                  {index + 1}
                </Button>
                <span className='text-sm font-medium'>{step.title}</span>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`flex-1 ${
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
      <div className='space-y-4'>
        {stepper.switch({
          LearPN: () => (
            <div className='flex justify-around gap-4 align-middle'>
              <PaymentComponent setCurrentData={setCurrentData} />
              <LearPNComponent setCurrentData={setCurrentData} />
            </div>
          ),
          complete: () => (
            <CompleteComponent
              currentData={currentData}
              setCurrentData={setCurrentData}
            />
          ),
        })}
        {!stepper.isLast ? (
          <div className='flex justify-end gap-4'>
            <Button
              variant='secondary'
              onClick={stepper.prev}
              disabled={stepper.isFirst}
            >
              Back
            </Button>
            <Button onClick={stepper.next}>
              {stepper.isLast ? 'Complete' : 'Next'}
            </Button>
          </div>
        ) : (
          <Button onClick={stepper.reset}>Reset</Button>
        )}
      </div>
    </div>
  )
}

const LearPNComponent = ({ setCurrentData }) => {
  return (
    <div className='mx-auto w-full max-w-md p-6'>
      <Card className='rounded-2xl shadow-lg'>
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Material Code */}
          <div className='space-y-2'>
            <Label htmlFor='storageUnit'>HU Galia</Label>
            <div className='flex gap-2'>
              <Input
                id='storageUnit'
                onChange={(e) => {
                  setCurrentData((prev: any) => {
                    return {
                      ...prev,
                      materile: { ...prev.materile, storageUn: e.target.value },
                    }
                  })
                }}
                placeholder='Enter HU Galia'
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='availableStock'>Available Stock</Label>
            <Input
              id='availableStock'
              onChange={(e) => {
                setCurrentData((prev: any) => {
                  return {
                    ...prev,
                    materile: { ...prev.materile, availStock: e.target.value },
                  }
                })
              }}
              placeholder='Enter Quantity Galia'
              className='w-full'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const PaymentComponent = ({ setCurrentData }) => {
  const [learPN, setLearPN] = useState('')
  const [part, setPart] = useState({
    tescaPN: '',
    desc: '',
    qtyPerBox: '',
  })
  const [loading, setLoading] = useState(false)

  const handleFetchPart = async () => {
    if (!learPN.trim()) {
      console.log({ title: 'Error', description: 'Please enter a Lear PN' })
      return
    }

    setLoading(true)
    try {
      // 👇 Replace this URL with your backend endpoint
      const response = await fetch(
        `http://localhost:8080/api/parts/lear?learPN=${learPN}`
      )
      if (!response.ok) throw new Error('Part not found')
      const data = await response.json()
      setCurrentData((prev: any) => ({
        ...prev,
        part: data,
      }))
      setPart({
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
        qtyPerBox: data.qtyPerBox || '',
      })

      console.log({
        title: 'Part found',
        description: 'Fields filled automatically',
      })
    } catch (error) {
      console.log({ title: 'Error', description: 'Part not found' })
      setPart({
        tescaPN: '',
        desc: '',
        qtyPerBox: '',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto w-full max-w-md p-6'>
      <Card className='rounded-2xl shadow-lg'>
        <CardHeader>
          <CardTitle>Part Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Lear PN */}
          <div className='space-y-2'>
            <Label htmlFor='learPN'>Lear PN</Label>
            <div className='flex gap-2'>
              <Input
                id='learPN'
                value={learPN}
                onChange={(e) => setLearPN(e.target.value)}
                placeholder='Enter Lear PN'
                className='w-full'
              />
              <Button onClick={handleFetchPart} disabled={loading}>
                {loading ? 'Loading...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Auto-filled fields */}
          <div className='space-y-2'>
            <Label htmlFor='tescaPN'>Tesca PN</Label>
            <Input
              id='tescaPN'
              value={part.tescaPN}
              readOnly
              placeholder='Auto-filled'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='desc'>Description</Label>
            <Input
              id='desc'
              value={part.desc}
              readOnly
              placeholder='Auto-filled'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const CompleteComponent = ({ currentData, setCurrentData }) => {
  const total = currentData.part.qtyPerBox

  const [ticketCode, setTicketCode] = useState(null)
  const [current, setCurrent] = useState(0)

  const [barcode1, setBarcode1] = useState('')
  const [barcode2, setBarcode2] = useState('')
  const [barcodes, setBarcodes] = useState<
    { barcode1: string; barcode2: string }[]
  >([])

  const handleNext = () => {
    if (current < total) {
      setCurrent((prev) => prev + 1)
    }
  }

  const itemsLeft = total - current
  const progress = (current / total) * 100

  const handleGenerate = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/ticketscode/creat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suffix: currentData.part.learPN.slice(-5) }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to create ticket code')
      }

      const data = await res.json()
      console.log(data.code)

      setTicketCode(data.code)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  const handleAdd = () => {
    if (!barcode1.trim() || !barcode2.trim()) {
      toast.error('Please enter both barcodes.')
      return
    }

    if (barcode1 != currentData.part.learPN) {
      toast.error('Please this must match trhe lear pn code')
      return
    }

    if (barcodes.length >= currentData.part.qtyPerBox) {
      toast.warning(
        `You can only add up to ${currentData.part.qtyPerBox}barcode pairs.`
      )
      return
    }

    const newList = [...barcodes, { barcode1, barcode2 }]
    setBarcodes(newList)
    setBarcode1('')
    setBarcode2('')
    handleNext()
  }

  const handleValidate = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tickets/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          barcodes.map((b) => ({
            learPN: b.barcode1,
            barcode: b.barcode2,
            ticketCode,
          }))
        ),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to create ticket code')
      }

      toast.warning(`You can have succesfully added ${barcodes.length}`)
    } catch (err: any) {
      console.error(err.message)
    }
  }
  return (
    <div className='mx-auto w-full max-w-2xl space-y-6 p-6'>
      <Card className='rounded-2xl shadow-lg'>
        <CardHeader>
          <CardTitle>Barcode Collector</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Input fields */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='barcode1'>Réf Lear</Label>
              <Input
                id='barcode1'
                value={barcode1}
                onChange={(e) => setBarcode1(e.target.value)}
                placeholder='Réf Lear'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='barcode2'>Traceability Code</Label>
              <Input
                id='barcode2'
                value={barcode2}
                onChange={(e) => setBarcode2(e.target.value)}
                placeholder='Traceability Code'
              />
            </div>
          </div>
          <Card className='mx-auto mt-10 w-full max-w-md'>
            <CardHeader>
              <CardTitle className='text-center'>Progress Tracker</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-muted-foreground flex justify-between text-sm'>
                <span>
                  {itemsLeft > 0
                    ? `${itemsLeft} item${itemsLeft > 1 ? 's' : ''} left`
                    : 'All done 🎉'}
                </span>
                <span className='text-primary font-medium'>
                  {Math.round(progress)}%
                </span>
              </div>

              <Progress value={progress} className='h-3' />

              
            </CardContent>
          </Card>
          <div className='flex justify-between'>
            <p>{ticketCode}</p>
            {barcodes.length >= currentData.part.qtyPerBox ? (
              <Button onClick={handleGenerate} className='w-full sm:w-auto'>
                generate code
              </Button>
            ) : (
              <Button onClick={handleAdd} className='w-full sm:w-auto'>
                add
              </Button>
            )}

            <Button className='border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white'>
              scan code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {barcodes.length > 0 && (
        <Card className='rounded-2xl shadow-md'>
          <CardHeader>
            <CardTitle> Traceability Code Added</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Réf Lear </TableHead>
                  <TableHead>Traceability Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barcodes.map((b, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{b.barcode1}</TableCell>
                    <TableCell>{b.barcode2}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Generated Code */}
      {ticketCode && (
        <div className='mt-4 text-center'>
          <p className='text-lg font-semibold'>
            ✅ Generated Code:{' '}
            <span className='text-primary font-mono'>{ticketCode}</span>
          </p>
          <Button onClick={handleValidate} className='w-full sm:w-auto'>
            validate
          </Button>
        </div>
      )}
    </div>
  )
}

export default StepperDemo
