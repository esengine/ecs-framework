/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module FUI.common {

	export class UI_com_tips extends fairygui.GComponent {
		public m_content:fairygui.GTextField;
		public static URL:string = "ui://minsdstak7mf0";

		public static createInstance():UI_com_tips {
			return <UI_com_tips>(fairygui.UIPackage.createObject("common", "com_tips"));
		}

		protected constructFromXML(xml:any):void {
			super.constructFromXML(xml);

			this.m_content = <fairygui.GTextField>(this.getChildAt(1));
		}
	}
}