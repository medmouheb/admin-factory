import * as React from 'react'
import { useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { toast } from "sonner"


const { useStepper, steps, utils } = defineStepper(
  {
    id: 'shipping',
    title: 'Shipping',
    description: 'Enter your shipping details',
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Enter your payment details',
  },
  { id: 'complete', title: 'Complete', description: 'Checkout complete' }
)

function StepperDemo() {
  const stepper = useStepper()

  const currentIndex = utils.getIndex(stepper.current.id)
  return (
    <div className='l m-4 p-4'>
      <div className='flex justify-between'>
        <h2 className='text-lg font-medium'>Checkout</h2>
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
          shipping: () => <ShippingComponent />,
          payment: () => <PaymentComponent />,
          complete: () => <CompleteComponent />,
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

const ShippingComponent = () => {
  const [materialCode, setMaterialCode] = useState('')
  const [material, setMaterial] = useState({
    description: '',
    storageUnit: '',
    availableStock: '',
  })
  const [loading, setLoading] = useState(false)

  const handleFetchMaterial = async () => {
    if (!materialCode.trim()) {
      console.log({
        title: 'Error',
        description: 'Please enter a material code',
      })
      return
    }
    setLoading(true)
    try {
      // 👇 Replace this with your backend API endpoint
      const response = await fetch(
        `http://localhost:8080/api/materials/code?material=${materialCode}`
      )
      if (!response.ok) throw new Error('Material not found')
      const data = await response.json()

      setMaterial({
        description: data.materialDescription || '',
        storageUnit: data.storageUn || '',
        availableStock: data.availStock || '',
      })
      console.log({
        title: 'Material found',
        description: 'Fields filled automatically',
      })
    } catch (error) {
      console.log({ title: 'Error', description: 'Material not found' })
      setMaterial({ description: '', storageUnit: '', availableStock: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto w-full max-w-md p-6'>
      <Card className='rounded-2xl shadow-lg'>
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Material Code */}
          <div className='space-y-2'>
            <Label htmlFor='materialCode'>Material Code</Label>
            <div className='flex gap-2'>
              <Input
                id='materialCode'
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                placeholder='Enter Material Code'
                className='w-full'
              />
              <Button onClick={handleFetchMaterial} disabled={loading}>
                {loading ? 'Loading...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Auto-filled fields */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Material Description</Label>
            <Input
              id='description'
              value={material.description}
              readOnly
              placeholder='Auto-filled'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='storageUnit'>Storage Unit</Label>
            <Input
              id='storageUnit'
              value={material.storageUnit}
              readOnly
              placeholder='Auto-filled'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='availableStock'>Available Stock</Label>
            <Input
              id='availableStock'
              value={material.availableStock}
              readOnly
              placeholder='Auto-filled'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const PaymentComponent = () => {
  const [learPN, setLearPN] = useState('')
  const [part, setPart] = useState({
    tescaPN: '',
    desc: '',
    qtyPerBox: ''
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

      setPart({
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
        qtyPerBox: data.qtyPerBox || ''
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

          <div className='space-y-2'>
            <Label htmlFor='qtyPerBox'>Quantity per Box</Label>
            <Input
              id='qtyPerBox'
              value={part.qtyPerBox}
              readOnly
              placeholder='Auto-filled'
            />
          </div>

         
        </CardContent>
      </Card>
    </div>
  )
}

const CompleteComponent = () => {
  const [barcode1, setBarcode1] = useState("")
  const [barcode2, setBarcode2] = useState("")
  const [barcodes, setBarcodes] = useState<{ barcode1: string; barcode2: string }[]>([])
  const [generatedCode, setGeneratedCode] = useState("")

  // Generate random uppercase alphanumeric string
  const randomCode = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
  }

  const handleAdd = () => {
    if (!barcode1.trim() || !barcode2.trim()) {
      toast.error("Please enter both barcodes.")
      return
    }

    if (barcodes.length >= 6) {
      toast.warning("You can only add up to 6 barcode pairs.")
      return
    }

    const newList = [...barcodes, { barcode1, barcode2 }]
    setBarcodes(newList)
    setBarcode1("")
    setBarcode2("")

    if (newList.length === 6) {
      const lastBarcode1 = newList[newList.length - 1].barcode1
      const lastTwo = lastBarcode1.slice(-2)
      const newCode = randomCode(8) + lastTwo
      setGeneratedCode(newCode)
      toast.success(`✅ Code generated: ${newCode}`)
    } else {
      toast.info(`Added pair ${newList.length} successfully.`)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle>Barcode Collector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode1">Barcode 1</Label>
              <Input
                id="barcode1"
                value={barcode1}
                onChange={(e) => setBarcode1(e.target.value)}
                placeholder="Enter barcode 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode2">Barcode 2</Label>
              <Input
                id="barcode2"
                value={barcode2}
                onChange={(e) => setBarcode2(e.target.value)}
                placeholder="Enter barcode 2"
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={barcodes.length >= 6}
            className="w-full sm:w-auto"
          >
            {barcodes.length >= 6 ? "Limit Reached" : "Add"}
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      {barcodes.length > 0 && (
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Added Barcodes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Barcode 1</TableHead>
                  <TableHead>Barcode 2</TableHead>
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
      {generatedCode && (
        <div className="text-center mt-4">
          <p className="text-lg font-semibold">
            ✅ Generated Code:{" "}
            <span className="font-mono text-primary">{generatedCode}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default StepperDemo
